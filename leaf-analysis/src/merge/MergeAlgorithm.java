package merge;

import com.google.gson.Gson;

import simulation.ModelSpec;
import simulation.Intention;

import java.util.*;

public class MergeAlgorithm {
	
	/**
	 * Merges two modelSpecs
	 * @param model1
	 * @param model2
	 * @param delta - how much longer model2 starts after model1 starts
	 * @return the merged model
	 */
	public static ModelSpec mergeModels(ModelSpec model1, ModelSpec model2, Integer delta){
		if (MMain.DEBUG) System.out.println("Starting: MergeAlgorithm");
		ModelSpec mergedModel = new ModelSpec();
		
		// update the models' times
		updateTimeline(model1, model2, delta);
		mergeIntentions(model1, model2, mergedModel);
		
		
		
		//Gson gson = new Gson();
		//System.out.println(gson.toJson(mergedModel));
		//System.out.println(gson.toJson(model2));
		
		return mergedModel;
	}
	
	/**
	 * Updates two modelSpecs' absolute and max time points
	 * @param model1
	 * @param model2
	 * @param delta
	 */
	public static void updateTimeline(ModelSpec model1, ModelSpec model2, Integer delta) {
		if (MMain.DEBUG) System.out.println("Starting: updateTimeline");
		
		// update max time for both models
		Integer oldMax = model2.getMaxTime();
		System.out.println(oldMax);
		model1.setMaxTime(oldMax + delta);
		model2.setMaxTime(oldMax + delta);
		
		// update absolute time points for model 2
		for(Integer absTP: model2.getAbsTP().values()) {
			absTP += delta;
		}
		
		// update absolute time points for model 2 stored in intentions
		for(Intention intention: model2.getIntentions()) {
			for(Integer absTP: intention.getUserEvals().keySet()) {
				absTP += delta;
			}
		}
	}
	
	/*public static String createID(int x, int model, String oldID, String type){
		//is this method for every kind of element? is there a new ID generator for each?
		return type + String(x) + "model" + String(model) + oldID;
	}*/

	// ******* Intention merging methods begin ******** //
	public static void mergeIntentions(ModelSpec model1, ModelSpec model2, ModelSpec newModel) {
		ArrayList<Intention> mergedIntentions = new ArrayList<Intention>();
		HashSet<String> mergedIntentionsNameSet = new HashSet<String>();
		int currIDCount = 0;
		
		for(Intention intention: model1.getIntentions()) {
			//TODO: update intention with some kind of tracking flag
			updateIntentionID(createID(currIDCount), intention.getID(), model1, intention);
			mergedIntentions.add(intention);
			mergedIntentionsNameSet.add(intention.getName());
			currIDCount++;
		}
		for(Intention intention: model2.getIntentions()) {
			if(!mergedIntentionsNameSet.contains(intention.getName)){
				//TODO: update this intention with some kind of tracking flag
				updateIntentionID(createID(currIDCount), intention.getID(), model2, intention);
				mergedIntentions.add(intention);
				mergedIntentionsNameSet.add(intention.getName());
				currIDCount++;
			}
			else{ 
				//This section merges intentions from model1 and model2 that are considered the same because they have the same name. 
				for(Intention mergedIntention: mergedIntentions){
					if(mergedIntention.getName().equals(intention.getName())){
						//actor
						if(!mergedIntention.getActor().getName().equals(intention.getActor().getName())){
							//UNRESOLVABLE CONFLICT
						}
						//type
						if(mergedIntention.compareType(intention) < 0){
							mergedIntention.setType(intention.getType());
						}
						//valuation
						userEvalsA = mergedIntention.getUserEvals();
						userEvalsB = intention.getUserEvals();

						for(int absTP: userEvalsA){
							if(userEvalsB.hasKey(absTP)){
								mergeValuationConsensus(userEvalsA.get(absTP).substring(1), userEvalsA.get(absTP).substring(2,4), userEvalsB.get(absTP).substring(1), userEvalsB.get(absTP).substring(2,4));
							}

						}

						//evolvingfunction
						/*if(mergedIntention.getEvolvingFunctions().length != 0 || intention.getEvolvingFunctions().length != 0){
							//TODO: GUllibility so don't need anything??? but mb Add an "evolving function" that represents the staticness of intention to mergedIntention??? d
						}*/
						mergedIntention.setEvolvingFunctions(Array.concat(mergedIntention.getEvolvingFunctions(), intention.getEvolvingFunctions()));

						//replace all mentions of intention with mergedIntention in Model2
						updateRepeatedIntention(mergedIntention, intention, model2);



					}
				}
			}
		}
		newModel.setIntentions(mergedIntentions);
		
	}

	public static void updateIntentionID(String newID, int curID, ModelSpec model, Intention intention){
		//don't need to update links because they contain direct references to the intentions, not their IDs
		//actors have no reference to intention IDs so don't have anything to update
		intention.setID(newID);
		for(FunctionSegment func: intentions.getEvolvingFunctions()){
			if(func.getStartTP().contains(curID)){
				func.replace(curID, newID);
			}
		}
	}

	/**
     * Add old links to new intentions and vice versa
	 */
	public static void updateRepeatedIntention(Intention newIntention, Intention oldIntention, ModelSpec model2){
		
		for(NotBothLink nbl: model2.getNotBothLink()){
			if(nbl.getElement1() == oldIntention){
				nbl.setElement1(newIntention);
			}
			if(nbl.getElement2() == oldIntention){
				nbl.setElement2(newIntention);
			}
		}
		for(ContributionLink cl: model2.getContributionLinks()){
			for(int i = 0; i < cl.getSrc().length; i++){
				if(cl.getSrc()[i] instanceof Intention && ((Intention)cl.getSrc()[i]) == oldIntention){
					cl.getSrc()[i] = newIntention;
				}
			}
			if(cl.getDest() == oldIntention){
				cl.setDest(newIntention);
			}
		}
		for(DecompositionLink dl: model2.getDecompositionLinks()){
			for(int i = 0; i < dl.getSrc().length; i++){
				if(dl.getSrc()[i] instanceof Intention && ((Intention)dl.getSrc()[i]) == oldIntention){
					dl.getSrc()[i] = newIntention;
				}
			}
			if(dl.getDest() == oldIntention){
				dl.setDest(newIntention);
			}
		}

	}

	public static String mergeValuationConsensus(String sat1, String den1, String sat2, String den2){
		HashMap<String, Integer> valueRanks = new HashMap<>();
		//not positive that i did these right!
		valueRanks.put("00", 0);
		valueRanks.put("11", 2);
		valueRanks.put("01", 1);

		String newSat = "";
		String newDen = "";

		if(valueRanks.get(sat1) < valueRanks.get(sat2)){
			newSat = sat1;
		} else{
			newSat = sat2;
		}

		if(valueRanks.get(den1) < valueRanks.get(den2)){
			newDen = den1;
		} else{
			newDen = den2;
		}

		return newSat + newDen;
	}


	// ******* Actor merging methods begin ******** //

	// ******* Link merging methods begin ******** //

	public static void mergeLinks(model1, model2, newModel){
		//Question what if there are two different relationships connecting the same intentions

		ArrayList<NotBothLink> mergedNBL = new ArrayList<>();
		ArrayList<ContributionLink> mergedCL = new ArrayList<>();
		ArrayList<DecompositionLink> mergedDL = new ArrayList<>();
		int linkCount = 0;

		for(NotBothLink nbl: model1.getNotBothLink()){
			newID = createID(linkCount);
			//NotBothLink doesn't have a id...
			linkCount++;
			mergedNBL.add(nbl);
		}
		for(ContributionLink cl: model1.getContributionLinks()){
			newID = createID(linkCount);
			//NotBothLink doesn't have a id...
			cl.setID(newID);
			linkCount++;
			mergedCL.add(cl);
		}
		for(DecompositionLink dl: model1.getDecompositionLinks()){
			newID = createID(linkCount);
			//NotBothLink doesn't have a id...
			dl.setID(newID);
			linkCount++;
			mergedDL.add(dl);
		}

		for(NotBothLink nbl: model2.getNotBothLink()){
			boolean isNewLink = true; //changing it....
			for(NotBothLink addednbl: mergedNBL){
				if(isSameLink(addednbl, nbl)){ 
					isNewLink = false;
					//merge these links
				}
			if(isNewLink)
				newID = createID(linkCount);
				//NotBothLink doesn't have a unique id...
				linkCount++;
				mergedNBL.add(nbl);
				//add link to intentions that it touches?
			}
		}
		for(ContributionLink cl: model2.getContributionLinks()){
			boolean isNewLink = true; //changing it....
			for(ContributionLink  addedcl: mergedCL){
				if(isSameLink(addedcl, cl)){ 
					isNewLink = false;
					//merge these links
					addedcl.setPreContribution(mergeContributionTypesSemiGullible(addedcl.getPreContribution(), cl.getPreContribution()));
					addedcl.setPostContribution(mergeContributionTypesSemiGullible(addedcl.getPostContribution(), cl.getPostContribution()));
					if(addedcl.getPostContribution() == ContributionType.NONE || addedcl.getPreContribution() == ContributionType.NONE){
						//Conflict alert user
					}
				} 
			if(isNewLink)
				newID = createID(linkCount);
				cl.setID(newID);
				linkCount++;
				mergedCL.add(cl);
				//add link to intentions that it touches
				cl.getZeroSrc().addLinksAsSrc(cl);
				cl.getDest().addLinksAsDest(cl);
				//check that it's the only intention in the destination intention list?
			}
		}
		for(DecompositionLink dl: model2.getDecompositionLinks()){
			boolean isNewLink = true; //changing it....
			for(DecompositionLink addeddl: mergedDL){
				if(isSameLink(addeddl, dl)){ 
					isNewLink = false;
					//merge these links
					if(addeddl.getPreContribution() != dl.getPreContribution()){
						addeddl.setPreContribution(DecompositionType.NONE);
						//Conflict alert user
					}
					if(addeddl.getPostContribution() != dl.getPostContribution()){
						addeddl.setPostContribution(DecompositionType.NONE);
						//Conflict alert user
					}
				}
			if(isNewLink)
				newID = createID(linkCount);
				dl.setID(newID);
				linkCount++;
				mergedDL.add(dl);
				//add link to intentions that it touches
				for(AbstractLinkableElement src: dl.getSrc()){
					src.addLinksAsSrc(dl);
				}
				dl.getDest().addLinksAsDest(dl);
				//check that it's the only intention in the destination intention list?
			}
		}

	}

	public static ContributionType mergeContributionTypesSemiGullible(ContributionType ct1, ContributionType ct2){
		String linkType1 = ct1.getCode();
		String linkType2 = ct2.getCode();
		if(linkType1.equals(linkType2)){
			return ct1;
		}
		if(linkType1.contains("-") && linkType2.contains("+") || linkType2.contains("+") && linkType1.contains("-")){
			return ContributionType.NONE;
		}
		if(linkType1.contains("+")){
			if(linkType1.contains("S") && linkType2.contains("D") || linkType2.contains("D") && linkType1.contains("S")){
				if(linkType1.contains("++") && linkType2.contains("++"){
					return ContributionType.PP;
				}
				return contributionType.P;
			}
			String newLinkType = "";
			if(linkType1.lastIndexOf("+") != linkType1.lastIndexOf("+")){
				newLinkType = "+";
			}
			else{
				newLinkType = linkType1.substring(linkType1.lastIndexOf("+"));
			}

			if(linkType1.contains("S") || linkType2.contains("S")){
				return ContributionType.getByCode(newLinkType + "S");
			}
			if(linkType1.contains("D") || linkType2.contains("D")){
				return ContributionType.getByCode(newLinkType + "D");
			}
			return ContributionType.getByCode(newLinkType);

		}
		if(linkType1.contains("-")){
			if(linkType1.contains("S") && linkType2.contains("D") || linkType2.contains("D") && linkType1.contains("S")){
				if(linkType1.contains("--") && linkType2.contains("--"){
					return ContributionType.PP;
				}
				return contributionType.P;
			}
			String newLinkType = "";
			if(linkType1.lastIndexOf("-") != linkType1.lastIndexOf("-")){
				newLinkType = "-";
			}
			else{
				newLinkType = linkType1.substring(linkType1.lastIndexOf("-"));
			}

			if(linkType1.contains("S") || linkType2.contains("S")){
				return ContributionType.getByCode(newLinkType + "S");
			}
			if(linkType1.contains("D") || linkType2.contains("D")){
				return ContributionType.getByCode(newLinkType + "D");
			}
			return ContributionType.getByCode(newLinkType);

		}
		return ContributionType.NONE;
		
	}

	/**
	 * Checks if two links of the same type connect the same intentions
	 *
	 */
	public static boolean isSameLink(AbstractElement link1, AbstractElement link2){
		if(link1 instanceof NotBothLink){
			return link1.getElement1().getName().equals(link2.getElement1().getName()) && link1.getElement2().getName().equals(link2.getElement2().getName());
		}
		if(link1 instanceof DecompositionLink){
			if(link1.getSrc().length != link2.getSrc().length){
				return false;
			}
			for(AbstractLinkableElement src1: link1.getSrc()){
				boolean found = false;
				for(AbstractLinkableElement src2: link2.getSrc()){
					if(src1 == src2){
						found = true;
					}
				}
				if(!found){
					return false;
				}
			}
			return link1.getDest() == link2.getDest();
		}
		return link1.getDest() == link2.getDest() && link1.getZeroSrc() == link2.getZeroSrc();
	}

	// ******* Evolving Functions merging methods begin ******** //


	
}
