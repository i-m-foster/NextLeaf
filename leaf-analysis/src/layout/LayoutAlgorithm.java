package layout;

import simulation.*;
import merge.*;

import java.util.*;

import gson_classes.BIPosition;
import gson_classes.BISize;

import static java.lang.Math.*;

public class LayoutAlgorithm {
	// models
	ModelSpec model;
    int maxIter;
    double constant;
    //double smallDistConstant;
    //double largeDistConstant;

	/**
	 * Initialize LayoutAlgorithm and run layoutModels
	 */

	public LayoutAlgorithm(ModelSpec model, String filename, int maxIter) {

		if (LMain.DEBUG) System.out.println("Starting: UCG Layout");
		// set up models
		this.model = model;

        // set up timeout
        this.maxIter = maxIter;
        
        // set up constant
        constant = .2 * Math.sqrt(6/(model.getActors().size() + model.getIntentions().size()));
        
        //smallDistConstant = .0000000002;
        //largeDistConstant = 200000;
        
        

        // TODO: some logging object init with filename
	}

    /**
     * Calculate the distance between two elements
     * @param x
     * @param y
     * @return distance
     */
    private double getDist(VisualInfo n1, VisualInfo n2){
        double distX = n1.getX() - n2.getX();
        double distY = n1.getY() - n2.getY();
        double dist = Math.sqrt(distX * distX + distY * distY);
        return dist;
    }

    /**
     * Calculate the force attraction given by
     * the expression (d*d/Cn)
     * @return the force attraction between two elements
     */
    private double getAttraction(VisualInfo n1, VisualInfo n2) {
    	//if (LMain.DEBUG) System.out.println("Starting: getAttraction");
// 		Attraction based on simplified spring force using area
//        if (n1 != n2) {
//            double distX = n1.getX() - n2.getX();
//            double distY = n1.getY() - n2.getY();
//            double dist = Math.sqrt(distX * distX + distY * distY);
//            //double k; // default coefficient, set a value to it
//            //ouble area; // set a value to it
//            //double coef = k * Math.sqrt(area/nodePosition.size()); // area?
//            double forceSum = dist * dist / constant;
//            return forceSum;
//        }
    	
    	//Spring force attraction
    	//TODO: figure out the values of these constants
    	if (n1 != n2) {
    		double idealLength = 200;
        	double elasticityConstant = 5000; //increasing it means the spring is stiffer
        	
        	double dist = getDist(n1, n2);
        	//if (dist > 1000) {
        	//	elasticityConstant = largeDistConstant;
        	//}
        	//if (LMain.DEBUG) System.out.println(dist);
        	double forceSum = (idealLength - dist)*(idealLength - dist)/elasticityConstant; //cubing distance too big, but this is the wrong formula
        	//if (LMain.DEBUG) System.out.println("Attraction " + forceSum);
        	return forceSum;
    	}
    
        return 0;
    }
    
    /**
     * Calculate the force repulsion given by
     * the expression (Cn*Cn/d)
     * @return the force repulsion between two elements
     */

    private double getRepulsion(VisualInfo n1, VisualInfo n2) {
    	//if (LMain.DEBUG) System.out.println("Starting: getRepulsion");
        if (n1 != n2) {
            double dist = getDist(n1,n2);
            if(dist == 0) return 99;
            //double k; /// default coefficient, set a value to it
            //double area; // set a value to it
            //double coef = k * Math.sqrt(area/nodePosition.size()); // area?

            double alpha = 20000;
            //if (dist < 50) {
            //    alpha = smallDistConstant;
            //}
            //double alpha = 20000; // repulsion constant

            double forceSum = alpha / (dist * dist) * dist; 
            //double forceSum = constant * constant / dist;
            //if (LMain.DEBUG) System.out.println("Repulsion " + forceSum);
            return forceSum;

        }
        return 0;
    }
    
    /*
     * Calculate the angle between two nodes
     * 
     */
    public double angleBetween(VisualInfo n1, VisualInfo n2) {
    	//if (LMain.DEBUG) System.out.println("Starting: angleBetween");
        if(n1 != n2){
            double distX = n1.getX() - n2.getX();
            double distY = n1.getY() - n2.getY();
            double theta = Math.atan(distY/distX);
            //if they are at the same position:
            if(Double.isNaN(theta)) return Math.random();
            if(n1.getX() == 50 && n1.getY() == 50) {
	            if (LMain.DEBUG) System.out.println("distX"+distX);
	            if (LMain.DEBUG) System.out.println("distY"+distY);
            }
            if(theta < 0 && distY > 0 || distX < 0 && distY < 0) return theta + Math.PI;
            return theta;
        }
        return 0;
    }
    
    /**
     * Find the upper left node
     */
    // public VisualInfo findUpperLeftNode(VisualInfo[] nodePositions) {
    // 	VisualInfo mostUpperLeft = null;
    // 	for(VisualInfo nodePosition: nodePositions) {
    // 		if(mostUpperLeft == null) {
    // 			mostUpperLeft = nodePosition;
    // 		} else {
    // 			double diffX = mostUpperLeft.getX() - nodePosition.getX();
    // 			double diffY = nodePosition.getY() - mostUpperLeft.getY();
    // 			if(diffX + diffY > 0) {
    // 				mostUpperLeft = nodePosition;
    // 			}
    // 		}
    // 	}
    // 	return mostUpperLeft;
    // }
    
    /*
     * Find center of the model
     * using the formula which finds the intersection of two lines 
     */
    public VisualInfo findCenter(VisualInfo[] nodePositions) {
        VisualInfo mostLeft = nodePositions[0];
        VisualInfo mostRight = nodePositions[0];
        VisualInfo mostUpper = nodePositions[0];
        VisualInfo mostBottom = nodePositions[0];
        for(VisualInfo nodePosition: nodePositions) {
            if(nodePosition.getX() < mostLeft.getX()){
            	mostLeft = nodePosition;
            }
            if(nodePosition.getX() > mostRight.getX()){
            	mostRight = nodePosition;
            }
            if(nodePosition.getY() < mostUpper.getY()){
            	mostUpper = nodePosition;
            }
            if(nodePosition.getY() > mostBottom.getY()){
            	mostBottom = nodePosition;
            }
            
        }
        
        VisualInfo center = new VisualInfo();

        double x_left = mostLeft.getX() - mostLeft.getSize().getWidth()/2;
        double y_left = mostLeft.getY();
        double x_right = mostRight.getX() + mostRight.getSize().getWidth()/2;
        double y_right = mostRight.getY();
        double x_upper = mostUpper.getX();
        double y_upper = mostUpper.getY() + mostLeft.getSize().getHeight()/2; // + or - ? double check symbol
        double x_bottom = mostLeft.getX();
        double y_bottom = mostLeft.getY() - mostLeft.getSize().getHeight()/2;
        // if ((x1 == x2 && y1 == y2) || (x3 == x4 && y3 == y4)) {
        //     return false ;
        // }
        double denominator = ((y_bottom - y_upper) * (x_right - x_left) - (x_bottom - x_upper) * (y_right - y_left));
        double ua = ((x_bottom - x_upper) * (y_left - y_upper) - (y_bottom - y_upper) * (x_left - x_upper)) / denominator ;
        double ua = ((x_right - x_left) * (y_left - y_upper) - (y_right - y_left) * (x_left - x_upper)) / denominator ;
        // denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));// ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator ;
        // ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator ;

      // Return a object with the x and y coordinates of the intersection
        double x = x_left + ua * (x_right - x_left);
        double y = y_left + ua * (y_right - y_left);
        // double x = x1 + ua * (x2 - x1);
        // double y = y1 + ua * (y2 - y1);
        center.setX(x);
        center.setY(y);
        //set the size of the canvas
        center.setWidth((int)(2*Math.abs(x1-x2)));
        center.setHeight((int)(2*Math.abs(y1-y2)));
        return center;
    }


    /*
        Main Layout method
     */ 
        
	public ModelSpec layoutModel(){
		if (LMain.DEBUG) System.out.println("Starting: layoutModel");
		
        VisualInfo[] nodePositions = initNodePositions();
        LayoutVisualizer lV = new LayoutVisualizer(nodePositions);
        VisualInfo center = new VisualInfo(new BISize(500,500), new BIPosition(500.0, 500.0));//findCenter(nodePositions);
		//if (LMain.DEBUG) System.out.println(center);
        
        //constants
        double c = .2; //adjustment
        double a = .05; //error
        double gravitation = .1; //gravitation forces
        
		for(int i = 0; i < maxIter; i++){
			if (LMain.DEBUG) System.out.println("\n" + i + "th Iteration");
			if (LMain.DEBUG) System.out.println(Arrays.toString(nodePositions));
			
//            //sum up forces for the X and Y directions
//            Double[] forceX = new Double[nodePositions.length];
//            Double[] forceY = new Double[nodePositions.length];
//            //fill out indices of forceX and forceY
//            Arrays.fill(forceX, 0.0);
//            Arrays.fill(forceY, 0.0);
            
            
            for(int j = 0; j < nodePositions.length; j++){
            	if (LMain.DEBUG) System.out.println(j + "th Node\n");
            	//if (LMain.DEBUG) System.out.println(Arrays.toString(forceX));
            	//if (LMain.DEBUG) System.out.println(Arrays.toString(forceY));
            	//if (LMain.DEBUG) System.out.println("\n" + j + "th Node\n");

                for(int k = 0; k < nodePositions.length; k++){
                    if(j ==k) continue;  
                    //TODO: Force constants, sizes? How to know...
                    //if (LMain.DEBUG) System.out.println("Starting: layoutModel Calculations");
                    double dist = getDist(nodePositions[j], nodePositions[k]);
                    double theta = angleBetween(nodePositions[k], nodePositions[j]);
                    double attraction = (getAttraction(nodePositions[j], nodePositions[k]));
                    double repulsion = (getRepulsion(nodePositions[j], nodePositions[k]));
                    if (LMain.DEBUG) System.out.println("Distance: " + dist);
                    //if (LMain.DEBUG) System.out.println("Adjust Attraction: " + attraction);
                    //if (LMain.DEBUG) System.out.println(repulsion);
                    if(Double.isNaN(theta) ||Double.isNaN(attraction) || Double.isNaN(repulsion)) {
                    	//TODO: Throw error
                    	return model;
                    }
                    
                    //if (LMain.DEBUG) System.out.println("Starting: layoutModel adding to sum");
//                    forceX[j] += (attraction*Math.cos(theta) - repulsion*Math.cos(theta));
//                    forceY[j] += (attraction*Math.sin(theta) - repulsion*Math.sin(theta));
//                    
//                    forceX[k] -= (attraction*Math.cos(theta) - repulsion*Math.cos(theta));
//                    forceY[k] -= (attraction*Math.sin(theta) - repulsion*Math.sin(theta));
                    
                    double x_shift = c*(attraction*Math.cos(theta) - repulsion*Math.cos(theta));
                    double y_shift = c*(attraction*Math.sin(theta) - repulsion*Math.sin(theta));
                    
                    if (LMain.DEBUG) System.out.println("x_shift" + x_shift);
                    if (LMain.DEBUG) System.out.println("y_shift" + y_shift);
                    
                    nodePositions[j].setX(nodePositions[j].getX() + x_shift);
                    nodePositions[j].setY(nodePositions[j].getY() + y_shift);
                    
                    nodePositions[k].setX(nodePositions[k].getX() - x_shift);
                    nodePositions[k].setY(nodePositions[k].getY() - y_shift);
                    
                    //if (LMain.DEBUG) System.out.println(Arrays.toString(nodePositions));
                    
                }
                
                //adjust positions based on gravity from the center
                double phi = angleBetween(center, nodePositions[j]); 
                if (LMain.DEBUG) System.out.println("phi: " + phi);
                nodePositions[j].setX(nodePositions[j].getX() + gravitation*Math.cos(phi));
                nodePositions[j].setY(nodePositions[j].getY() + gravitation*Math.sin(phi));
                
            }
            
            
            
            //adjust the positions
//            if (LMain.DEBUG) System.out.println("Starting: layoutModel Adjustments");
//            for(int j = 0; j < nodePositions.length; j++){
//                nodePositions[j].setX(nodePositions[j].getX() + c/forceX[j]);
//                nodePositions[j].setY(nodePositions[j].getY() + c*forceY[j]);
//            }

            //calculate error
            //TODO: figure out a good stopping condition
            //if (LMain.DEBUG) System.out.println("Starting: layoutModel calculating error");
            //if (Math.abs(sum(forceX)) < a && Math.abs(sum(forceY)) < a) break;
            
            if(checkConds(nodePositions, center)) {
            	if (LMain.DEBUG) System.out.println("Conditions Met");
            	return model;
            }
            
            lV.update();
        }
		if (LMain.DEBUG) System.out.println(Arrays.toString(nodePositions));
		if (LMain.DEBUG) System.out.println("Finished: layoutModel");
		return model;
	}

    /**
        Initialize the node position array
        Collect VisualInfo objects from modelSpec's Actors and Intentions
     */
    public VisualInfo[] initNodePositions(){
        VisualInfo[] nodePositions = new VisualInfo[model.getActors().size() + model.getIntentions().size()];
        int index = 0;

        //get Actor visual info
        for(Actor a: model.getActors()){
            nodePositions[index] = a.getVisualInfo();
            index++;
        }
        //get Intention visual info
        for(Intention i: model.getIntentions()){
            nodePositions[index] = i.getVisualInfo();
            index++;
        }

        return nodePositions;
    }

    /**
        Array Sum Helper
     */
     public double sum(Double[] arr){
         int sum = 0;
         for(Double i: arr){
             sum += i;
         }
         return sum;
     }
     
     /**
      * boolean method for the overlap of two nodes
      */
     public boolean isOverlapped(VisualInfo n1, VisualInfo n2) {
    	 double n1_xmin = n1.getX() - n1.getSize().getWidth()/2;
    	 double n1_xmax = n1.getX() + n1.getSize().getWidth()/2;
    	 double n1_ymin = n1.getY() - n1.getSize().getHeight()/2;
    	 double n1_ymax = n1.getY() + n1.getSize().getHeight()/2;
    	 
    	 double n2_xmin = n2.getX() - n2.getSize().getWidth()/2;
    	 double n2_xmax = n2.getX() + n2.getSize().getWidth()/2;
    	 double n2_ymin = n2.getY() - n2.getSize().getHeight()/2;
    	 double n2_ymax = n2.getY() + n2.getSize().getHeight()/2;
    	 
    	 return !(n1_xmin >= n2_xmax || n1_xmax <= n2_xmin || n1_ymin >= n2_ymax || n1_ymax <= n2_ymin);
     }
     
     /**
      * boolean method to determine if the node is outside of a border
      * @param n1 the node
      * @param n2 the border
      * @return
      */
     public boolean isOutside(VisualInfo n1, VisualInfo n2) {
    	 double n1_xmin = n1.getX() - n1.getSize().getWidth()/2;
    	 double n1_xmax = n1.getX() + n1.getSize().getWidth()/2;
    	 double n1_ymin = n1.getY() - n1.getSize().getHeight()/2;
    	 double n1_ymax = n1.getY() + n1.getSize().getHeight()/2;
    	 
    	 double n2_xmin = n2.getX() - n2.getSize().getWidth()/2;
    	 double n2_xmax = n2.getX() + n2.getSize().getWidth()/2;
    	 double n2_ymin = n2.getY() - n2.getSize().getHeight()/2;
    	 double n2_ymax = n2.getY() + n2.getSize().getHeight()/2;
    	 
    	 return (n1_xmin < n2_xmin || n1_ymin < n2_ymin || n1_xmax > n2_xmax || n1_ymax > n2_ymax);
    	 
     }
     
     /**
      * This method determines if the nodes are close enough to each other. 
      * We construct a graph from the nodes, and if the graph is connected then it is close enough.
      * @param nodePositions
      * @return
      */
     public boolean isCloseEnough(VisualInfo[] nodePositions) {
    	 //TODO: limits for heuristic for distance between nodes
    	 double edgeLength_max = 200/(1 + 1000*Math.pow(Math.E, nodePositions.length * -1)) + 100;
    	 
    	//Make a graph 
    	 HashSet<Integer[]> edgeSet = new HashSet<Integer[]>();
    	 
    	 for(int i = 0; i < nodePositions.length; i++) {
    		 for(int j = 0; j < nodePositions.length; j++) {
    			 if(i == j) continue;
    			 if(getDist(nodePositions[i], nodePositions[j]) <= edgeLength_max) {
    				edgeSet.add(new Integer[]{i,j});
    			 }
    		 }
    	 }
    	 if (LMain.DEBUG) {
    		 System.out.println("Edge Heuristic: "+ edgeLength_max);
    		 System.out.println("Number of Nodes: "+ nodePositions.length);
    		 System.out.print("EdgeSet: {");
    		 for(Integer[] edge: edgeSet) System.out.print(Arrays.toString(edge) + ", ");
    	 }
    	 
    	 //traverse the graph; if all the nodes are visited, the graph is connected.
    	 return DFS(edgeSet, new HashSet<Integer>(), 0).size() == nodePositions.length;
     }
     
     /**
      * Traverse the graph
      * @param edgeSet
      * @param visitedSet
      * @param currentVertex
      * @return visitedSet
      */
     public HashSet<Integer> DFS(HashSet<Integer[]> edgeSet, HashSet<Integer> visitedSet, Integer currentVertex) {
    	 //label the current node as visited
    	 visitedSet.add(currentVertex);
    	 if (LMain.DEBUG) System.out.println("visitedSet: " + visitedSet);
    	 HashSet<Integer> neighborSet = new HashSet<>();
    	 for(Integer[] edge: edgeSet) {
    		 if(edge[0] == currentVertex) neighborSet.add(edge[1]);
    	 }
    	 
    	 for(Integer neighbor: neighborSet) {
    		 if(visitedSet.contains(neighbor)) continue;
    		 visitedSet = DFS(edgeSet, visitedSet, neighbor);
    	 }
    	
    	 return visitedSet;
     }
     
     /**
      * TODO: How to check for correctness? and how to correct for incorrectness
      * Checks conditions and if goal model positions satisfies them;
      * @param nodePositions
      * @param border
      * @return
      */
     public boolean checkConds(VisualInfo[] nodePositions, VisualInfo border) {
    	 if (LMain.DEBUG) System.out.println("Checking COnditions");
    	 for(VisualInfo n1: nodePositions) {
    		 for(VisualInfo n2: nodePositions) {
    			 if(n1 == n2) continue;
    			 if(isOverlapped(n1, n2)) return false;
    		 }
    	 }
    	 return isCloseEnough(nodePositions);
     }
     
     /**
      * TODO: what's a good way to do this?
      * @param num
      * @param distance?
      * @return
      */
     public double makeSmall(Double num) {
    	 while(num > 10000) {
    		 num = num / 10;
    	 }
    	 return num;
     }

    
}

