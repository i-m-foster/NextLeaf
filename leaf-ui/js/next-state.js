/**
 * New file for Next State Window.
 */

{ // LOCAL GLOBAL VARIABLES
    var analysis = {};
    analysis.intentions = []; // Array of all of the intentions on the graph

    var filterOrderQueue = [];

    // Analysis objects from original window
    var myInputJSObject;
    myInputJSObject.request; // configBBM of the selected configuration 
    myInputJSObject.results; // resultBBM of results from the backend

    var originalResults; // Copy of the original results to save as a reference

    // An array of all of the solutions and every element is another array 
    // with all of the refEvidencePairs for the intentions at that solution
    var allSolutionArray = [];
    // Hashmap to keep track of at which index each array from allSolutions starts and ends once they 
    // are combined into allSolutionArray
    var allSolutionIndex;

    //Executing scripts only when page is fully loaded
    window.onload = function () {
        analysis.page = jQuery.extend({}, window.opener.document);
        init();
        renderNavigationSidebar();
    }

    /**
     * Initializes all of the components needed for the popup window
     */
    function init() {
        //Page objects
        analysis.graph = new joint.dia.BloomingGraph();
        analysis.paper;
        analysis.paperScroller;

        // Create Paper object
        analysis.paper = new joint.dia.Paper({
            width: 1200,
            height: 600,
            gridSize: 10,
            perpendicularLinks: false,
            model: analysis.graph,
            defaultLink: new joint.shapes.basic.CellLink({ //new joint.dia.Link({
                'attrs': {
                    '.connection': { stroke: '#000000' },
                    '.marker-source': { 'd': '0' },
                    '.marker-target': { stroke: '#000000', "d": 'M 10 0 L 0 5 L 10 10 L 0 5 L 10 10 L 0 5 L 10 5 L 0 5' }
                },
                'labels': [{ position: 0.5, attrs: { text: { text: "and" } } }]
            })
        });

        // Add scroll feature to the paper.
        analysis.paperScroller = new joint.ui.PaperScroller({
            autoResizePaper: true,
            paper: analysis.paper
        });
        $('#paper').css("right", "0px");
        $('#paper').append(analysis.paperScroller.render().el);
        analysis.paperScroller.center();

        // Make a copy of the graph and add it to the window.
        analysis.graph.fromJSON(JSON.parse(backendStringifyCirc(window.opener.graph.toJSON())));

        // These object hold the request and results for the object.
        // console.log("Request:" + JSON.stringify(myInputJSObject.request.toJSON()));
        // console.log("Result:" + JSON.stringify(myInputJSObject.results.toJSON()));
        // console.log(myInputJSObject.request);
        // console.log(myInputJSObject.results);

        // Filter out Actors and save all intentions into an array
        for (var i = 0; i < analysis.graph.getElements().length; i++) {
            if (!(analysis.graph.getElements()[i] instanceof joint.shapes.basic.Actor))
                analysis.intentions.push(analysis.graph.getElements()[i]);
        }
        // Turns the hashmap allSolutions into an array so the sidebar can be rendered
        combineAllSolutions();

        // Sets originalResults as a deep copy of myInputJSObject.results 
        // So originalResults does not contain references to myInputJSObject.results
        originalResults = $.extend(true, {}, myInputJSObject.results);
    }

    function combineAllSolutions() {
        // Clear array and create blank hashmap
        allSolutionArray = [];
        allSolutionIndex = new Map();
        var i = 0;
        // Iterates over the hashmap allSolutions and combines all of the solutions into one array
        for (var key in myInputJSObject.results.get('allSolutions')) {

            // Finds the index of the first element that will be added to allSolution
            if (i != 0) {
                i++;
            }
            // Adds the starting index and its key to hashmap
            allSolutionIndex[key] = i;

            // Adds every element (which are arrays) in the old array to the new array
            myInputJSObject.results.get('allSolutions')[key].forEach(
                solution => {
                    allSolutionArray.push(solution);
                })
            // Finds the index of the last element added to allSolution
            i = allSolutionArray.length - 1;

            // Adds the ending index and its key to hashmap - TODO: Do we need the end?
            //allSolutionIndex.set(key + "End", i);
        }
    }

    /**
     * Updates the satisfaction values of the elements based on which page is selected
     * 
     * @param {Integer} currentPage 
     * The number of the page that is selected in the next State window
     */
    function updateNodesValues(currentPage) {
        if (currentPage == "")
            currentPage = 0;

        //Set the currentState variable so it can be sent back to the original path
        var i = 0;
        for (let element of analysis.intentions) {
            satValue = allSolutionArray[currentPage][i];
            element.attr(".satvalue").value = satValue;

            // Sets attributes of element from the refEvidence pair from resultBBM
            if ((satValue == "0001") || (satValue == "0011")) {
                element.attr(".satvalue/text", "(F, ⊥)");
                element.attr({ text: { fill: 'black' } });
            } else if (satValue == "0010") {
                element.attr(".satvalue/text", "(P, ⊥)");
                element.attr({ text: { fill: 'black' } });
            } else if ((satValue == "1000") || (satValue == "1100")) {
                element.attr(".satvalue/text", "(⊥, F)");
                element.attr({ text: { fill: 'black' } });
            } else if (satValue == "0100") {
                element.attr(".satvalue/text", "(⊥, P)");
                element.attr({ text: { fill: 'black' } });
            } else if (satValue == "0110") {
                element.attr(".satvalue/text", "(P, P)");
                element.attr({ text: { fill: 'red' } });
            } else if ((satValue == "1110") || (satValue == "1010")) {
                element.attr(".satvalue/text", "(P, F)");
                element.attr({ text: { fill: 'red' } });
            } else if ((satValue == "0111") || (satValue == "0101")) {
                element.attr(".satvalue/text", "(F, P)");
                element.attr({ text: { fill: 'red' } });
            } else if ((satValue == "1111") || (satValue == "1001") || (satValue == "1101") || (satValue == "1011")) {
                element.attr(".satvalue/text", "(F, F)");
                element.attr({ text: { fill: 'red' } });
            } else if (satValue == "0000") {
                element.attr(".satvalue/text", "(⊥,⊥)");
                element.attr({ text: { fill: 'black' } });
            } else {
                element.removeAttr(".satvalue/d");
            }
            i++;
        }
    }

    /**
     * Renders sidebar on left side of next State
     * 
     * @param {Integer} currentPage 
     * The number of the page that is selected in the next State window
     */
    function renderNavigationSidebar(currentPage = 0) {
        var pagination = document.getElementById("pagination");
        var num_states_lbl = document.getElementById("num_states_lbl");
        var currentPageIn = document.getElementById("currentPage");
        // Clear any previous pages by reseting page values
        pagination.innerHTML = "";
        num_states_lbl.innerHTML = "";
        currentPageIn.value = "";

        num_states_lbl.innerHTML += (allSolutionArray.length);

        currentPageIn.value = currentPage.toString();

        updatePagination(currentPage);
        updateNodesValues(currentPage);

        renderEVO();
    }

    /**
     * Is called whenever the slider changes and when the sidebar is rendered.
     */
    function renderEVO() {
        EVONextState.setColorBlindFromPrevWindow();
        EVONextState.setSliderOptionNextState();
    }

    /**
     * Updates which page is selected 
     * 
     * @param {Integer} currentPage
     * The number of the page that is selected in the next State window 
     */
    function updatePagination(currentPage) {
        var pagination = document.getElementById("pagination");
        var nextSteps_array_size = allSolutionArray.length;
        if (nextSteps_array_size > 6) {
            renderPreviousBtn(pagination, currentPage);
            if (currentPage - 3 < 0) {
                for (var i = 0; i < 6; i++) {
                    render_pagination_values(currentPage, i);
                }
            } else {
                if (currentPage + 3 < nextSteps_array_size) {
                    for (i = currentPage - 3; i < currentPage + 3; i++) {
                        render_pagination_values(currentPage, i);
                    }
                } else {
                    for (i = currentPage - 3; i < nextSteps_array_size; i++) {
                        render_pagination_values(currentPage, i);
                    }
                }
            }
            renderForwardBtn(pagination, currentPage)
        } else {
            renderPreviousBtn(pagination, currentPage);
            for (var i = 0; i < nextSteps_array_size; i++) {
                render_pagination_values(currentPage, i);
            }
            renderForwardBtn(pagination, currentPage)
        }
    }

    /**
     * Renders the 'previous' button on the next State sidebar
     */
    function renderPreviousBtn(pagination, currentPage) {
        var value;
        if (currentPage == 0) {
            value = 0;
        } else {
            value = currentPage - 1;
        }
        pagination.innerHTML += '<a href="#" onclick="renderNavigationSidebar(' + value.toString() + ')">&laquo;</a>';
    }

    /**
     * Renders the 'next' button on the next State sidebar
     */
    function renderForwardBtn(pagination, currentPage) {
        var value;
        var nextSteps_array_size = allSolutionArray.length;

        if (currentPage == nextSteps_array_size - 1) {
            value = currentPage;
        } else {
            value = currentPage + 1;
        }
        pagination.innerHTML += '<a href="#" onclick="renderNavigationSidebar(' + value.toString() + ')">&raquo;</a>';
    }

    /**
     * Renders the correct pages values you can select in next state based on the current selected state
     */
    function render_pagination_values(currentPage, i) {
        var pagination = document.getElementById("pagination");
        if (currentPage == i) {
            pagination.innerHTML += '<a href="#" class="active" onclick="renderNavigationSidebar(' + i.toString() + ')">' + i.toString() + '</a>';
        } else {
            pagination.innerHTML += '<a href="#" onclick="renderNavigationSidebar(' + i.toString() + ')">' + i.toString() + '</a>';
        }
    }

    /**
     * Selects entered state based on user input 
     */
    function goToState() {
        var requiredState = parseInt(document.getElementById("requiredState").value);
        var nextSteps_array_size = allSolutionArray.length;

        if ((requiredState != "NaN") && (requiredState > 0)) {
            if (requiredState > nextSteps_array_size) {
                renderNavigationSidebar(nextSteps_array_size);
            } else {
                renderNavigationSidebar(requiredState);
            }
        }
    }

    /**
     * This function checks which boxes in next State have been checked/unchecked and shows the correct results
     * based on this. The first switch case has been documented with comments.
     */
    function add_filter() {
        console.log("clicked");
        // Everytime a box is clicked/unclicked the results are reset
        myInputJSObject.results = originalResults;
        // Deep copy of results so it doesn't contain references to the original object
        tempResults = $.extend(true, {}, myInputJSObject.results);

        var checkboxes = document.getElementsByClassName("filter_checkbox");
        for (var i = 0; i < checkboxes.length; i++) {
            var checkbox = checkboxes[i];
            // check if something is just checked
            if (checkbox.checked) {
                if (filterOrderQueue.indexOf(checkbox.id) == -1) {
                    filterOrderQueue.push(checkbox.id);
                }
            }
            // check if something is just unchecked
            else {
                if (filterOrderQueue.indexOf(checkbox.id) != -1) {
                    filterOrderQueue.splice(filterOrderQueue.indexOf(checkbox.id), 1);
                }
            }
        }
        console.log(filterOrderQueue);

        // Iterates over all of the boxes that have been checked
        for (var i = 0; i < filterOrderQueue.length; i++) {
            switch (filterOrderQueue[i]) {
                case "conflictFl":
                    console.log("conflictFl");
                    // Iterates over every key/value pair in the hashmap
                    for (var solutionArray in tempResults.get('allSolutions')) {
                        // Empty array to that will contain all of the indices of the solutions we want
                        var index_to_rm = [];
                        // Iterates over all of the solutions in the key/value pair 
                        for (var solution_index = 0; solution_index < tempResults.get('allSolutions')[solutionArray].length; solution_index++) {
                            // Iterates over all of the elements in the solution
                            for (var element_index = 0; element_index < tempResults.get('allSolutions')[solutionArray][solution_index].length; element_index++) {
                                // Checks the value of each itention and if the value satisfyies the conditions then the
                                // Index is pushed to the index array
                                var value = tempResults.get('allSolutions')[solutionArray][solution_index][element_index];
                                if ((value == "0110") ||
                                    (value == "0111") ||
                                    (value == "0101") ||
                                    (value == "1110") ||
                                    (value == "1010") ||
                                    (value == "1111") ||
                                    (value == "1001") ||
                                    (value == "1101") ||
                                    (value == "1011")) {
                                    index_to_rm.push(solution_index);
                                    break;
                                }
                            }
                        }
                        // Iterates over the array with all of the indexes that satisfy the condition
                        for (var to_rm = 0; to_rm < index_to_rm.length; to_rm++) {
                            // Adds only the indexes that satisfy the condition to the array inside the hashmap
                            tempResults.get('allSolutions')[solutionArray].splice(index_to_rm[to_rm] - to_rm, 1);
                        }
                    }
                    break;
                case "ttFl":
                    console.log("ttFl");

                    for (var solutionArray in tempResults.get('allSolutions')) {
                        var index_to_rm = [];
                        for (var solution_index = 0; solution_index < tempResults.get('allSolutions')[solutionArray].length; solution_index++) {
                            for (var element_index = 0; element_index < tempResults.get('allSolutions')[solutionArray][solution_index].length; element_index++) {
                                var value = tempResults.get('allSolutions')[solutionArray][solution_index][element_index];
                                if (value == "0000") {
                                    index_to_rm.push(solution_index);
                                    break;
                                }
                            }
                        }
                        for (var to_rm = 0; to_rm < index_to_rm.length; to_rm++) {
                            tempResults.get('allSolutions')[solutionArray].splice(index_to_rm[to_rm] - to_rm, 1);
                        }
                    }
                    break;
                case "leastTasksSatisfied":
                    console.log("leastTasksSatisfied");

                    for (var solutionArray in tempResults.get('allSolutions')) {
                        var index_to_keep = [];
                        var index_to_rm = [];

                        var least_t_s = tempResults.get('allSolutions')[solutionArray].length;
                        for (var solution_index = 0; solution_index < tempResults.get('allSolutions')[solutionArray].length; solution_index++) {
                            var num_t_s = 0;
                            for (var element_index = 0; element_index < tempResults.get('allSolutions')[solutionArray][solution_index].length; element_index++) {
                                if (analysis.intentions[element_index].get('type') === 'basic.Task') {
                                    var value = tempResults.get('allSolutions')[solutionArray][solution_index][element_index];
                                    if ((value == "0010" || value == "0011")) {
                                        num_t_s++;
                                    }
                                }
                            }
                            if (least_t_s > num_t_s) {
                                least_t_s = num_t_s;
                                index_to_rm = index_to_rm.concat(index_to_keep);
                                index_to_keep = [];
                            }
                            if (num_t_s == least_t_s) {
                                index_to_keep.push(solution_index);
                            }
                            if (num_t_s > least_t_s) {
                                index_to_rm.push(solution_index);
                            }
                        }
                        index_to_rm.sort(function (a, b) { return a - b });
                        for (var to_rm = 0; to_rm < index_to_rm.length; to_rm++) {
                            tempResults.get('allSolutions')[solutionArray].splice(index_to_rm[to_rm] - to_rm, 1);
                        }
                    }
                    break;
                case "mostTasksSatisfied":
                    console.log('mostTasksSatisfied');

                    for (var solutionArray in tempResults.get('allSolutions')) {
                        var index_to_keep = [];
                        var index_to_rm = [];

                        var most_t_s = 0;
                        for (var solution_index = 0; solution_index < tempResults.get('allSolutions')[solutionArray].length; solution_index++) {
                            var num_t_s = 0;
                            for (var element_index = 0; element_index < tempResults.get('allSolutions')[solutionArray][solution_index].length; element_index++) {
                                if (analysis.intentions[element_index].get('type') === 'basic.Task') {
                                    var value = tempResults.get('allSolutions')[solutionArray][solution_index][element_index];
                                    if ((value == "0010" || value == "0011")) {
                                        num_t_s++;
                                    }
                                }
                            }
                            if (most_t_s < num_t_s) {
                                most_t_s = num_t_s;
                                index_to_rm = index_to_rm.concat(index_to_keep);
                                index_to_keep = [];
                            }
                            if (num_t_s == most_t_s) {
                                index_to_keep.push(solution_index);
                            }
                            if (num_t_s < most_t_s) {
                                index_to_rm.push(solution_index);
                            }
                        }
                        index_to_rm.sort(function (a, b) { return a - b });
                        for (var to_rm = 0; to_rm < index_to_rm.length; to_rm++) {
                            tempResults.get('allSolutions')[solutionArray].splice(index_to_rm[to_rm] - to_rm, 1);
                        }
                    }
                    break;
                case "leastResource":
                    console.log("leastResource");

                    for (var solutionArray in tempResults.get('allSolutions')) {
                        var index_to_keep = [];
                        var index_to_rm = [];

                        var least_r_s = tempResults.get('allSolutions')[solutionArray].length;
                        for (var solution_index = 0; solution_index < tempResults.get('allSolutions')[solutionArray].length; solution_index++) {
                            var num_r_s = 0;
                            for (var element_index = 0; element_index < tempResults.get('allSolutions')[solutionArray][solution_index].length; element_index++) {
                                if (analysis.intentions[element_index].get('type') === 'basic.Resource') {
                                    // if (selectedResult.allSolution[solution_index].intentionElements[element_index].type === "RESOURCE"){
                                    var value = tempResults.get('allSolutions')[solutionArray][solution_index][element_index];
                                    if ((value == "0010" || value == "0011")) {
                                        num_r_s++;
                                    }
                                }
                            }
                            if (least_r_s > num_r_s) {
                                least_r_s = num_r_s;
                                index_to_rm = index_to_rm.concat(index_to_keep);
                                index_to_keep = [];
                            }
                            if (num_r_s == least_r_s) {
                                index_to_keep.push(solution_index);
                            }
                            if (num_r_s > least_r_s) {
                                index_to_rm.push(solution_index);
                            }
                        }
                        index_to_rm.sort(function (a, b) { return a - b });
                        for (var to_rm = 0; to_rm < index_to_rm.length; to_rm++) {
                            tempResults.get('allSolutions')[solutionArray].splice(index_to_rm[to_rm] - to_rm, 1);
                        }
                    }
                    break;
                case "mostResource":
                    console.log("mostResource");

                    for (var solutionArray in tempResults.get('allSolutions')) {
                        var index_to_keep = [];
                        var index_to_rm = [];

                        var most_r_s = 0;
                        for (var solution_index = 0; solution_index < tempResults.get('allSolutions')[solutionArray].length; solution_index++) {
                            var num_r_s = 0;
                            for (var element_index = 0; element_index < tempResults.get('allSolutions')[solutionArray][solution_index].length; element_index++) {
                                if (analysis.intentions[element_index].get('type') === 'basic.Resource') {
                                    var value = tempResults.get('allSolutions')[solutionArray][solution_index][element_index];
                                    if ((value == "0010" || value == "0011")) {
                                        num_r_s++;
                                    }
                                }
                            }
                            if (most_r_s < num_r_s) {
                                most_r_s = num_r_s;
                                index_to_rm = index_to_rm.concat(index_to_keep);
                                index_to_keep = [];
                            }
                            if (num_r_s == most_r_s) {
                                index_to_keep.push(solution_index);
                            }
                            if (num_r_s < most_r_s) {
                                index_to_rm.push(solution_index);
                            }
                        }
                        index_to_rm.sort(function (a, b) { return a - b });
                        for (var to_rm = 0; to_rm < index_to_rm.length; to_rm++) {
                            tempResults.get('allSolutions')[solutionArray].splice(index_to_rm[to_rm] - to_rm, 1);
                        }
                    }
                    break;
                case "leastGoalSatisfied":
                    console.log("leastGoalSatisfied");

                    for (var solutionArray in tempResults.get('allSolutions')) {
                        var index_to_keep = [];
                        var index_to_rm = [];

                        var least_goal_s = tempResults.get('allSolutions')[solutionArray].length;
                        for (var solution_index = 0; solution_index < tempResults.get('allSolutions')[solutionArray].length; solution_index++) {
                            var num_g_s = 0;
                            for (var element_index = 0; element_index < tempResults.get('allSolutions')[solutionArray][solution_index].length; element_index++) {
                                if (analysis.intentions[element_index].get('type') === 'basic.Goal') {
                                    var value = tempResults.get('allSolutions')[solutionArray][solution_index][element_index];
                                    if ((value == "0010" || value == "0011")) {
                                        num_g_s++;
                                    }
                                }
                            }
                            if (least_goal_s > num_g_s) {
                                least_goal_s = num_g_s;
                                index_to_rm = index_to_rm.concat(index_to_keep);
                                index_to_keep = [];
                            }
                            if (num_g_s == least_goal_s) {
                                index_to_keep.push(solution_index);
                            }
                            if (num_g_s > least_goal_s) {
                                index_to_rm.push(solution_index);
                            }
                        }
                        index_to_rm.sort(function (a, b) { return a - b });
                        for (var to_rm = 0; to_rm < index_to_rm.length; to_rm++) {
                            tempResults.get('allSolutions')[solutionArray].splice(index_to_rm[to_rm] - to_rm, 1);
                        }
                    }
                    break;
                case "mostGoalSatisfied":
                    console.log("mostGoalSatisfied");

                    for (var solutionArray in tempResults.get('allSolutions')) {
                        var index_to_keep = [];
                        var index_to_rm = [];

                        var most_goal_s = 0;
                        for (var solution_index = 0; solution_index < tempResults.get('allSolutions')[solutionArray].length; solution_index++) {
                            var num_g_s = 0;
                            for (var element_index = 0; element_index < tempResults.get('allSolutions')[solutionArray][solution_index].length; element_index++) {
                                if (analysis.intentions[element_index].get('type') === 'basic.Goal') {
                                    var value = tempResults.get('allSolutions')[solutionArray][solution_index][element_index];
                                    if ((value == "0010" || value == "0011")) {
                                        num_g_s++;
                                    }
                                }
                            }
                            if (most_goal_s < num_g_s) {
                                most_goal_s = num_g_s;
                                index_to_rm = index_to_rm.concat(index_to_keep);
                                index_to_keep = [];
                            }
                            if (num_g_s == most_goal_s) {
                                index_to_keep.push(solution_index);
                            }
                            if (num_g_s < most_goal_s) {
                                index_to_rm.push(solution_index);
                            }
                        }
                        index_to_rm.sort(function (a, b) { return a - b });
                        for (var to_rm = 0; to_rm < index_to_rm.length; to_rm++) {
                            tempResults.get('allSolutions')[solutionArray].splice(index_to_rm[to_rm] - to_rm, 1);
                        }
                    }
                    break;
                case "LeastActor":
                    console.log("LeastActor");
                    if (analysis.intentions.length === analysis.graph.getElements().length) {
                        swal("Error: Cannot apply this filter with no actors.", "", "error");
                        $('#LeastActor').prop('checked', false);
                    } else {
                        for (var solutionArray in tempResults.get('allSolutions')) {
                            var index_to_keep = [];
                            var index_to_rm = [];
                            var least_actor = tempResults.get('allSolutions')[solutionArray].length;
                            for (var solution_index = 0; solution_index < tempResults.get('allSolutions')[solutionArray].length; solution_index++) {
                                var actors = {};
                                for (var element_index = 0; element_index < tempResults.get('allSolutions')[solutionArray][solution_index].length; element_index++) {
                                    if (!actors[analysis.intentions[element_index].actorId]) {
                                        console.log(analysis.intentions[element_index]);
                                        actors[analysis.intentions[element_index].actorId] = 0;
                                    }
                                    var value = tempResults.get('allSolutions')[solutionArray][solution_index][element_index];
                                    if ((value == "0010" || value == "0011" || (value == "0110") ||
                                        (value == "0111") ||
                                        (value == "0101") ||
                                        (value == "1110") ||
                                        (value == "1010") ||
                                        (value == "1111") ||
                                        (value == "1001") ||
                                        (value == "1101") ||
                                        (value == "1011"))) {
                                        actors[analysis.intentions[element_index].actorId] = 1;
                                    }
                                }
                                console.log(actors);
                                var int_sat = Object.values(actors).reduce((a, b) => a + b);
                                console.log(int_sat)
                                if (least_actor > int_sat) {
                                    least_actor = int_sat;
                                    index_to_rm = index_to_rm.concat(index_to_keep);
                                    index_to_keep = [];
                                }
                                if (int_sat == least_actor) {
                                    index_to_keep.push(solution_index);
                                }
                                if (int_sat > least_actor) {
                                    index_to_rm.push(solution_index);
                                }

                            }
                            index_to_rm.sort(function (a, b) { return a - b });
                            for (var to_rm = 0; to_rm < index_to_rm.length; to_rm++) {
                                tempResults.get('allSolutions')[solutionArray].splice(index_to_rm[to_rm] - to_rm, 1);
                            }
                        }
                    }
                    break;
                case "mostActor":
                    console.log("mostActor");
                    if (analysis.intentions.length === analysis.graph.getElements().length) {
                        swal("Error: Cannot apply this filter with no actors.", "", "error");
                        $('#mostActor').prop('checked', false);
                    } else {
                        for (var solutionArray in tempResults.get('allSolutions')) {
                            var most_actor = 0;
                            var index_to_keep = [];
                            var index_to_rm = [];
                            for (var solution_index = 0; solution_index < tempResults.get('allSolutions')[solutionArray].length; solution_index++) {
                                var actors = {};
                                for (var element_index = 0; element_index < tempResults.get('allSolutions')[solutionArray][solution_index].length; element_index++) {
                                    if (!actors[analysis.intentions[element_index].actorId]) {
                                        console.log(analysis.intentions[element_index]);
                                        actors[analysis.intentions[element_index].actorId] = 0;
                                    }
                                    var value = tempResults.get('allSolutions')[solutionArray][solution_index][element_index];
                                    if ((value == "0010" || value == "0011" || (value == "0110") ||
                                        (value == "0111") ||
                                        (value == "0101") ||
                                        (value == "1110") ||
                                        (value == "1010") ||
                                        (value == "1111") ||
                                        (value == "1001") ||
                                        (value == "1101") ||
                                        (value == "1011"))) {
                                        actors[analysis.intentions[element_index].actorId] = 1;
                                    }
                                }
                                var int_sat = Object.values(actors).reduce((a, b) => a + b);
                                if (most_actor < int_sat) {
                                    most_actor = int_sat;
                                    index_to_rm = index_to_rm.concat(index_to_keep);
                                    index_to_keep = [];
                                }
                                if (int_sat == most_actor) {
                                    index_to_keep.push(solution_index);
                                }
                                if (int_sat < most_actor) {
                                    index_to_rm.push(solution_index);
                                }

                            }
                            index_to_rm.sort(function (a, b) { return a - b });
                            for (var to_rm = 0; to_rm < index_to_rm.length; to_rm++) {
                                tempResults.get('allSolutions')[solutionArray].splice(index_to_rm[to_rm] - to_rm, 1);
                            }
                        }
                    }
                    break;
                case "mostConstraintSatisfaction":

                    for (var solutionArray in tempResults.get('allSolutions')) {
                        console.log(solutionArray);
                        var domains = {};
                        for (var solution_index = 0; solution_index < tempResults.get('allSolutions')[solutionArray].length; solution_index++) {
                            for (var element_index = 0; element_index < tempResults.get('allSolutions')[solutionArray][solution_index].length; element_index++) {
                                console.log(analysis.intentions[element_index].get('intention').cid)
                                if (!domains[analysis.intentions[element_index].get('intention').cid]) {
                                    domains[analysis.intentions[element_index].get('intention').cid] = [tempResults.get('allSolutions')[solutionArray][solution_index][element_index]];
                                } else {
                                    if (domains[analysis.intentions[element_index].get('intention').cid].indexOf(tempResults.get('allSolutions')[solutionArray][solution_index][element_index]) == -1) {
                                        domains[analysis.intentions[element_index].get('intention').cid].push(tempResults.get('allSolutions')[solutionArray][solution_index][element_index])
                                    }
                                }
                            }
                        }
                        console.log(domains);
                        var length_domain = {};
                        var least_domain = 9;
                        var int_with_smallest_domain = [];
                        Object.keys(domains).forEach(function (key) {
                            length_domain[key] = domains[key].length;
                            if (length_domain[key] < least_domain) {
                                least_domain = length_domain[key];
                                int_with_smallest_domain = [];
                            }
                            if (length_domain[key] == least_domain) {
                                int_with_smallest_domain.push(key);
                            }
                        });
                        var index_to_rm = [];
                        for (var solution_index = 0; solution_index < tempResults.get('allSolutions')[solutionArray].length; solution_index++) {
                            for (var element_index = 0; element_index < tempResults.get('allSolutions')[solutionArray][solution_index].length; element_index++) {
                                if (int_with_smallest_domain.indexOf(analysis.intentions[element_index].get('intention').cid) != -1) {
                                    if (tempResults.get('allSolutions')[solutionArray][solution_index][element_index] !== "0011") {
                                        index_to_rm.push(solution_index);
                                        break;
                                    }
                                }
                            }
                        }
                        for (var to_rm = 0; to_rm < index_to_rm.length; to_rm++) {
                            tempResults.get('allSolutions')[solutionArray].splice(index_to_rm[to_rm] - to_rm, 1);
                        }
                        console.log(domains);
                    }
                    break;
                default:
                    console.log("default");
                    break;
            }
        }
        $("body").removeClass("spinning"); // Remove spinner from cursor
        // Set the new results with filters as the analysis object
        myInputJSObject.results = tempResults;
        // Creates array with all Solutions from new hashmap
        combineAllSolutions();
        renderNavigationSidebar();
    }

    /*  This function should get the current state in the screen and 
    *   save in the original path, as well as generate the remainder
    *   of the simulation path.
    */
    function save_current_state() {
        console.log('saveCurrentState');
        console.log(myInputJSObject.request);
        updateAnalysisRequestWithCurrentState();
        myInputJSObject.request.set('action', "updatePath");
        window.opener.backendSimulationRequest(myInputJSObject.request);
        window.close();
    }

    /*This function should get the current state in the screen and 
    *   save in the original path, as well as generates
    *   all possible next states.
    */
    function generate_next_states() {
        console.log(myInputJSObject.results);
        console.log(myInputJSObject.request.get('numRelTime'));
        console.log(myInputJSObject.results.get('selectedTimePoint'));
        // TODO: Fix: This is incorrect...should be the length of the original path or if there are any timepoints left.
        // if ((myInputJSObject.results.get('selectedTimePoint') + 1)>= myInputJSObject.request.get('numRelTime')) {   
        //     swal("Error: Cannot explore next state past this time point.", "", "error");
        // } else {
        $("body").addClass("spinning"); // Adds spinner animation to page
        updateAnalysisRequestWithCurrentState();
        window.opener.backendSimulationRequest(myInputJSObject.request);
        window.close();
        // }
    }

    /**
     * This funtion should update the analysis request with the state that is currently selected
     */
    function updateAnalysisRequestWithCurrentState() {
        console.log('updateAnalysisRequestwithCurrentState');
        console.log(myInputJSObject.request);
        // Create temporary variable for previous results.
        var newPreviousAnalysis = myInputJSObject.results;
        // Increment selected time point, because the user selected the values for this state.
        newPreviousAnalysis.set('selectedTimePoint', newPreviousAnalysis.get('selectedTimePoint') + 1);

        // Get the page number currently selected on the interface.
        var currentPage = document.getElementById("currentPage").value;     // Page number associated with the selected state.

        // Get the name associated with the selected state.
        var stateName;
        for (var key in allSolutionIndex) {
            if (allSolutionIndex[key] <= currentPage) {
                stateName = key;
            }
        }

        // Determine the next time point.
        var timePointPath = newPreviousAnalysis.get('timePointPath');
        var nextTimePointAbsVal;
        if (stateName == 'TNS-A' && newPreviousAnalysis.get('nextPossibleAbsValue') != null) {
            nextTimePointAbsVal = newPreviousAnalysis.get('nextPossibleAbsValue');
        } else {
            nextTimePointAbsVal = newPreviousAnalysis.get('nextPossibleRndValue');
        }
        timePointPath.push(nextTimePointAbsVal);

        // Iterates over each of the time point values and get them an assignment to the next time point.
        var listStateTPs = newPreviousAnalysis.get('nextStateTPs')[stateName];
        listStateTPs.forEach(
            solution => {
                newPreviousAnalysis.get('timePointAssignments')[solution] = nextTimePointAbsVal;
            })

        // Update the elementList with the new states satisfaction values.
        var elementList = newPreviousAnalysis.get('elementList');
        for (let i = 0; i < elementList.length; i++) {
            elementList[i].status.push(allSolutionArray[currentPage][i]);
        }

        // Update values that are no longer needed.        
        newPreviousAnalysis.set('name', null);
        newPreviousAnalysis.set('colorVis', null);
        newPreviousAnalysis.set('nextStateTPs', null);
        newPreviousAnalysis.set('allSolutions', null);
        newPreviousAnalysis.set('nextPossibleAbsValue', null);
        newPreviousAnalysis.set('nextPossibleRndValue', null);

        // Assign back to request.
        myInputJSObject.request.set('previousAnalysis', newPreviousAnalysis);
        // myInputJSObject.request.set('results', null);
        console.log("New Request:" + JSON.stringify(myInputJSObject.request.toJSON()));
    }
} // End of LOCAL GLOBAL VARIABLES