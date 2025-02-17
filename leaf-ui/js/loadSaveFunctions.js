/**
 * Read and load a saved JSON file
 *
 */
// Simulator
loader = document.getElementById("loader");
reader = new FileReader();

// Whenever the input is changed, read the file.
loader.onchange = function () {
	reader.readAsText(loader.files.item(0));
	// Resets loader value so that the onchange event will still be triggered 
	// if the same file is cleared and then loaded again
	loader.value = "";
};

// When read is performed, if successful, load that file.
reader.onload = function () {

	// If JSON is not recognized as a BloomingLeaf model, just return
	if (!reader.result) {
		return;
	}
	clearInspector();
	var result = JSON.parse(reader.result);
	loadFromObject(result);
	var graphtext = JSON.stringify(graph.toJSON());
	document.cookie = "graph=" + graphtext;
}

/**
 * Given an object obj containing a model, graph and analysis configurations and results, 
 * updates the global variables: model, graph and analysisMap
 * to the objects from obj
 * If the obj does not contain analysis information, do not update global vars
 *
 * @param {Object} obj
 */
function loadFromObject(obj) {
	graph.fromJSON(obj.graph);
	var cells = graph.getCells();
	for (var i = 0; i < cells.length; i++) {
		cell = cells[i];
		if (cell.get('type') == "basic.Actor") {
			createBBActor(cell) //Create actor
		} else if (cell.get('type') == "basic.CellLink") {
			createBBLink(cell) //Create link
		} else {
			// Singled out functionSegList from obj as it doesn't show up in the graph after reading from JSON
			var funcseg = obj.graph.cells[i].intention.attributes.evolvingFunction.attributes.functionSegList;
			createBBElement(cell, funcseg) //Create element
		}
	}
	loadConstraints();
	// If the object contains configCollection, create configCollection fields from JSON
	if (obj.configCollection != undefined) {
		loadConfig(obj.configCollection)
	}
}

/**
 * Returns an array of Constraint objects with information from 
 * arr
 *
 * @param {Array.<Object>} arr
 * @returns {Array.<Constraint>}
 */
/*
function getConstArr(arr) {
	var res = [];

	for (var i = 0; i < arr.length; i++) {
		var constraint = Object.assign(new Constraint, arr[i]);
		constraint.absoluteValue = arr[i].absoluteValue;
		res.push(constraint);
	}
	return res;
}

/**
 * Returns an array of Actor objects with information from 
 * arr
 *
 * @param {Array.<Object>} arr
 * @returns {Array.<Actor>}
 *//*
function getActorsArr(arr) {
   var res = [];
   var maxID = 0;
   
   for (var i = 0; i < arr.length; i++) {
	   res.push(Object.assign(new Actor, arr[i]));
	   maxID = Math.max(maxID, parseInt(arr[i].nodeID));
   }
   Actor.numOfCreatedInstances = maxID + 1;
   return res;
   
}

/**
* Returns an array of Link objects with information from 
* arr
*
* @param {Array.<Object>} arr
* @returns {Array.<Link>}
*//*
function getLinksArr(arr) {
   var res = [];
   var maxID = 0;

   for (var i = 0; i < arr.length; i++) {
	   var link = new Link(arr[i].linkType, arr[i].linkSrcID, arr[i].absoluteValue);
	   link.linkID = arr[i].linkID;
	   link.postType = arr[i].postType;
	   link.linkDestID = arr[i].linkDestID;
	   maxID = Math.max(maxID, parseInt(arr[i].linkID));
	   res.push(link);
   }
   Link.numOfCreatedInstances = maxID + 1;

   return res;
}

/**
* Returns an array of Intention objects with information from 
* arr
*
* @param {Array.<Object>} arr
* @returns {Array.<Intention>}
*//*
function getIntentionsArr(arr) {
   var res = [];
   var maxID = 0;

   for (var i = 0; i < arr.length; i++) {
	   var intention = new Intention(arr[i].nodeType, arr[i].nodeName);	// nodeType has been removed.
	   intention.nodeID = arr[i].nodeID;
	   maxID = Math.max(maxID, parseInt(arr[i].nodeID));
	   intention.dynamicFunction = getEvolvingFunction(arr[i].dynamicFunction);
	   res.push(intention);
   }
   Intention.numOfCreatedInstances = maxID + 1;
   return res;
}

/**
* Given an object containing information about an EvolvingFunction,
* returns a corresponding EvolvingFunction object
*
* @param {Object} obj
* @returns {EvolvingFunction}
*//*
function getEvolvingFunction(obj) {
   var func = new EvolvingFunction(obj.intentionID);
   func.stringDynVis = obj.stringDynVis;
   func.functionSegList = getFuncSegList(obj.functionSegList);
   return func;
}

/**
* Returns an array of FuncSegment or RepFuncSegment objects with 
* information from arr
*
* @param {Array.<Object>} arr
* @returns {Array.<FuncSegment|RepFuncSegment>}
*/
/* TODO: Re-implement once we have finalized the functions segments.
function getFuncSegList(arr) {
	var res = [];
	for (var i = 0; i < arr.length; i++) {
		
		if (arr[i].repNum) {
			// If this segment is a repeating segment
			var repFunc = new RepFuncSegment();
			repFunc.functionSegList = getFuncSegList(arr[i].functionSegList);
			repFunc.repNum = arr[i].repNum;
			repFunc.absTime = arr[i].absTime;
			res.push(repFunc);
		} else {
			// If this segment is not a repeating segment
			res.push(new FuncSegment(arr[i].funcType, arr[i].funcX, arr[i].funcStart, arr[i].funcStop));
		}
	}
	return res;
}

*/

/**
 * Returns a backbone model Actor with information from the obj
 *
 */
function createBBActor(cell) {
	var actor = cell.get('actor');
	var actorBBM = new ActorBBM({ type: actor.attributes.type, actorName: actor.attributes.actorName });
	cell.set('actor', actorBBM)
}

/**
 * Returns a backbone model Link with information from the obj
 *
 */
function createBBLink(cell) {
	var link = cell.get('link').attributes;
	var linkBBM = new LinkBBM({ displayType: link.displayType, linkType: link.linkType, postType: link.postType, absTime: link.absTime, evolving: link.evolving });
	cell.set('link', linkBBM)
}

/**
 * Returns a backbone model Element with information from the obj
 *
 */
function createBBElement(cell, funcsegs) {
	var intention = cell.get('intention');
	var evol = intention.attributes.evolvingFunction.attributes;
	var intentionBBM = new IntentionBBM({ nodeName: intention.attributes.nodeName });

	var evolving = new EvolvingFunctionBBM({ type: evol.type, hasRepeat: evol.hasRepeat, repStart: evol.repStart, repStop: evol.repStop, repCount: evol.repCount, repAbsTime: evol.repAbsTime });
	for (let funcseg of funcsegs) {
		var funcsegBBM = new FunctionSegmentBBM({ type: funcseg.attributes.type, refEvidencePair: funcseg.attributes.refEvidencePair, startTP: funcseg.attributes.startTP, startAT: funcseg.attributes.startAT, current: funcseg.attributes.current });
		evolving.get('functionSegList').push(funcsegBBM);
	}
	var userEvals = intention.attributes.userEvaluationList;
	for (let userEval of userEvals) {
		intentionBBM.get('userEvaluationList').push(new UserEvaluationBBM({ assignedEvidencePair: userEval.attributes.assignedEvidencePair, absTime: userEval.attributes.absTime }));
	}
	intentionBBM.set('evolvingFunction', evolving);
	cell.set('intention', intentionBBM);
}

/**
 * Loads the constraints of graph as contraintBBM in a constraintCollection
 */
function loadConstraints() {
	var constraints = graph.get('constraints');
	var constraintCollection = new ConstraintCollection([]);
	var constraintBBM;
	for (let constraint of constraints) {
		constraintBBM = new ConstraintBBM({ type: constraint.type, srcID: constraint.srcID, destID: constraint.destID, srcRefTP: constraint.srcRefTP, destRefTP: constraint.destRefTP, absTP: constraint.absTP });
		constraintCollection.push(constraintBBM);
	}
	graph.set('constraints', constraintCollection);
}

/**
 * Returns an object that contains the current graph, model, and analysis configurations
 * and REMOVES results from the analysisConfigurations map.
 * This return object is what the user would download when clicking the Save button
 * in the top menu bar.
 *
 * @returns {Object}
 */
function getModelAnalysisJson(configCollection) {
	var obj = {};
	obj.graph = graph.toJSON();
	// Clone to spearate the result removal from what is displayed in ConfigInspector 
	var newConfig = configCollection.clone();

	// Remove results
	for (var i = 0; i < newConfig.length; i++) {
		newConfig.at(i).set('results', new ResultCollection([]))
	}
	obj.configCollection = newConfig.toJSON()

	return obj;
}

/**
 * Returns an object that contains the current graph, model and analysis configurations.
 * This return object is what the user would download when clicking the Save button
 * in the top menu bar.
 *
 * @returns {Object}
 */
function getFullJson(configCollection) {
	var obj = {};
	obj.graph = graph.toJSON();
	obj.configCollection = configCollection.toJSON();

	return obj;
}

/**
 * Helper function to download saved graph in JSON format
 */
function download(filename, text) {
	var dl = document.createElement('a');
	dl.setAttribute('href', 'data:application/force-download;charset=utf-8,' + encodeURIComponent(text));
	dl.setAttribute('download', filename);

	dl.style.display = 'none';
	document.body.appendChild(dl);

	dl.click();
	document.body.removeChild(dl);
}

/**
 * If a cookie exists, process it as a previously created graph and load it.
 */
if (document.cookie && document.cookie.indexOf('all=') !== -1) {

	var obj = JSON.parse(document.cookie.substr(4));

	try {
		loadFromObject(obj);
	} catch (e) {
		// This should never happen, but just in case
		alert('Previously stored cookies contains invalid JSON data. Please clear your cookies.');
	}
}