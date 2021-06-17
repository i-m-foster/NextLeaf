/**
 * backendComm.js Overview
 * This file contains the communication between the front and back end of Bloomingleaf.
 * When an analysis is run, the analysisRequest, model, and graph are bundled into an object, 
 * converted to JSON format, and sent to the backend,
 * which returns the analysisResult.
 * 
 * This is:
 * Simulate Single Path - Step 3
 * Explore Possible Next States - Step 3
 */

var url = "http://localhost:8080/untitled.html";	// Hardcoded URL for Node calls. 

function backendComm(jsObject){	
	/**
	* Print the input to the console.
	*/
	console.log("Step 3");
	console.log(JSON.stringify(jsObject));
	console.log(jsObject.analysisRequest.action);
    nodeBackendCommFunc(jsObject);
}

// Code for calling the java function via Node.
function nodeBackendCommFunc(jsObject){
   console.log("Calling Backend via Node Server"); //JSON.stringify(jsObject));
   
   var xhr = new XMLHttpRequest();
   var isGetNextSteps ;
   xhr.open("POST", url, true);
   xhr.setRequestHeader("Content-Type", "application/json");

   var data = JSON.stringify(jsObject);
   xhr.onreadystatechange = function() {	
		// This function get caled when the response is received.
		console.log("Reading the response");
		if (xhr.readyState == XMLHttpRequest.DONE) {
           if(jsObject.analysisRequest.action=="allNextStates"){
               isGetNextSteps = true;
           }
           else{
               isGetNextSteps = false;
        	}
            
            var response = xhr.responseText;
   			responseFunc(isGetNextSteps,response);
       }
   }
   xhr.send(data);	// Why is this sent down here? What is this send function.
}


//deal with the response sent back by the server
function responseFunc(isGetNextSteps, response){
	$("body").removeClass("waiting"); //Remove spinner under cursor 
	var results = JSON.parse(response);
	if (errorExists(results)) { 
		 var msg = getErrorMessage(results.errorMessage);
		 alert(msg);
	 }
	else {
		if (results == ""){ 
			 alert("Error while reading the resonse file from server. This can be due an error in executing java application.");
			 return;
		 }
		else {
			if(isGetNextSteps){ 
					console.log("All Paths Results (responseFunc):")
					console.log(JSON.stringify(results));	
					savedAnalysisData.allNextStatesResult = results;
					console.log("in backendcomm, saving all next state results");
					open_analysis_viewer();
			} else {
				savedAnalysisData.singlePathResult = results;
				console.log(JSON.stringify(results));			// Print the results of the analysis to the console.
				analysisResult = convertToAnalysisResult(results);
				displayAnalysis(analysisResult, false);
				// Get the currently selected configuration's results list
				// .where returns an array, but there should only ever be one selected so we just grab the first element
				currConfig = configCollection.where({selected: true})[0];
				currConfig.addResult(analysisResult);
				// // Save result to the corresponding analysis configuration object
				// currAnalysisConfig.addResult(analysisResult);
				// // Update results in analysis sidebar
				// updateResults();
				// // Add the analysisConfiguration to the analysisMap for access in the analysis config sidebar
				// analysisMap.set(currAnalysisConfig.id, currAnalysisConfig);
			 }
		 }
	 }
 }

function open_analysis_viewer(){
    var urlBase = document.URL.substring(0, document.URL.lastIndexOf('/')+1);
    var url = urlBase+"analysis.html";
    var w = window.open(url, Date.now(), "status=0,title=0,height=600,width=1200,scrollbars=1");

    if (!w) {
        alert('You must allow popups for this map to work.');
    }

}

/*
 * Returns true iff analysisResults indicates that there is
 * an error message.
 *
 * @param {Object} analysisResults
 *   results from backend java code
 * @returns {boolean}
 */
function errorExists(analysisResults) {
	return analysisResults.errorMessage != null;
}

/*
 * Returns a user-readable error message, containing
 * user-defined node names instead of node ids.
 *
 * Example message:
 * The model is not solvable because of conflicting constraints
 * involving nodes: mouse, keyboard, and pizza.
 *
 * @param {String} backendErrorMsg
 *   error message from backend
 * @returns {boolean}
 */
function getErrorMessage(backendErrorMsg) {

	// If node ids does not exist, just return the original error message for now
	if (!nodeIDsExists(backendErrorMsg)) {
		return backendErrorMsg;
	}

	var ids = getIDs(backendErrorMsg);
	var names = [];
	var actorNames = [];
	for (var i = 0; i < ids.length; i++) {
		names.push(getNodeName(ids[i]));
		actorNames.push(getParentActorNameById(ids[i]));
	}

	var s = 'The model is not solvable because of conflicting constraints involving nodes (with associated actors): ';
	var numOfNames = names.length;

	for (var i = 0; i < numOfNames - 1; i++) {
		s += names[i] + ' (' + actorNames[i] + ')';
		if (i < numOfNames - 2) {
			s += ', ';
		} else {
			s += ' ';
		}
	}

	s += 'and ' + names[numOfNames - 1] + ' (' + actorNames[numOfNames - 1] + ').';
	s += '\n\nOriginal Error: ' + backendErrorMsg;
	return s;
}

/*
 * Returns the actor name for an actor
 * that embeds an element with element id id.
 * If element with element id id is not embedded within an actor
 * returns 'no actor'.
 *
 * @param {String} id
 *   element id for the element of interest
 * @returns {String}
 */
function getParentActorNameById(id) {
	var actor = getParentActor(getElementById(id));
	if (actor) {
		return actor.attributes.attrs['.name'].text;
	}
	return 'no actor';
}

/*
 * Returns the actor which embeds the element of interest.
 * Returns null if there is no actor that embeds the element.
 * (If an actor embeds an element, the actor is the element's parent)
 *
 * @param {dia.Element} element
 * @returns {dia.Element | null}
 */
function getParentActor(element) {
	// get call the ancestors for the element
	var ancestors = element.getAncestors();
	if (ancestors.length == 0) {
		return null;
	}
	// if there is an ancestor, there would only be one
	return ancestors[0];
}

/*
 * Returns the element with element id id.
 * Returns null if no element with that element id exists.
 *
 * @param {String} id
 *   element id of the element of interest
 * @returns {dia.Element | null}
 */
function getElementById(id) {
	var elements = graph.getElements();
	for (var i = 0; i < elements.length; i++) {
		if (id == elements[i].attributes.nodeID) {
			return elements[i];
		}
	}
}

/**
 * Returns true iff node ids exists in msg
 *
 * @param {String} msg
 * @returns {Boolean}
 */
function nodeIDsExists(msg) {
	var pattern = /N\d{4}/g;
	return msg.match(pattern) != null;
}

/*
 * Returns an array of all node ids that are mentioned in
 * the backendErrorMsg, in the order they appear.
 *
 * @param {String} backendErrorMsg
 *   error message from backend
 * @returns {Array of String}
 */
function getIDs(backendErrorMsg) {
	// this regex matches for an N, followed by 4 digits
	var pattern = /N\d{4}/g;
	var arr = backendErrorMsg.match(pattern);

	// remove the preceding N's to get each id
	for (var i = 0; i < arr.length; i++) {
		arr[i] = arr[i].substring(1);
	}

	return arr;
}

function convertToAnalysisResult(results){
	var tempResult = new AnalysisResult();
	tempResult.assignedEpoch = results.assignedEpoch;
	tempResult.timePointPath = results.timePointPath;
	tempResult.timePointPathSize = results.timePointPathSize;
	tempResult.elementList = results.elementList;
	tempResult.allSolution = results.allSolution;
	tempResult.previousAnalysis = analysisResult;
	tempResult.colorVis = new EVO(results.elementList);
	tempResult.isPathSim = true;
	tempResult.colorVis.singlePathResponse(results.elementList);
	return tempResult;
}
