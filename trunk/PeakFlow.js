/*Copyright (c) 2012 Mathew Giaimo mgiaimo@gmail.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.*/

function peakFlow() {
    var _schema, _context, _chart, _jsonData, _updateData;
    var xmlData, patientName;

    _updateData = new Object();

    // Return a reference to updateData function so it is usable in html
    _updateData.updateData = updateData; 

    // Attach to window.onload event to make sure all elements are loaded
    window.onload = (function () {

    // Define schema (used when processing xml and json data)
    _schema = {
        rowTag: "date",
        columns: [
            { tagName: "@mmddyyyy", label: "Date" },
            { tagName: "morning", label: "Morning" },
            { tagName: "evening", label: "Evening" },
         ]
    };

    // Get data
    xmlData = getXML('datasample.xml');

    // Convert XML to jsonData
    _jsonData = xml2Json(xmlData);

    // Get chart
    _chart = document.getElementById('chart');
    // Define Canvas context
    _context = _chart.getContext('2d');

    // Update patient name
    patientName = document.getElementById('patient');
    patientName.innerText += " "+_jsonData["@patient"];

    buildTableXML('tableXML', xmlData);
    buildTableJSON('tableJSON');

    drawChart();

});

// for this to work in Chrome you must start it with
// the -allow-file-acces-from-files switch
function getXML(fileName) {
    var xmlHttp, xmlDoc;

    // Try to create XMLHttpRequest
    if(!xmlHttp) {
        try { 
            xmlHttp = new XMLHttpRequest(); 
        }
        catch(e) {
        xmlHttp=false;
        }
    }

    if (xmlHttp) {
        xmlHttp.open("GET", fileName, false);
        xmlHttp.send(null);
    }
    else {
        alert("Browser must support XMLHttpRequest (to read local xml file) and Canvas (HTML5)")
    }

    if (window.DOMParser){
      parser=new DOMParser();
      xmlDoc=parser.parseFromString(xmlHttp.responseText,"text/xml");
    }
     
    return xmlDoc;
}

// Returns the html table header for the peak flow table
function createTableHeader() {
    var header, headerRow;

    header = document.createElement("thead");
    headerRow = document.createElement("tr");

    for (var x = 0; x < _schema.columns.length; x++) {
        var col, label, cell;

        col = _schema.columns[x];
        label = col.label;
        cell = document.createElement("th");
        cell.appendChild(document.createTextNode(label));
        header.appendChild(cell);
    }

    // Add header row to header
    header.appendChild(headerRow);

    return header;
}

// Build an html table from the supplied xml data
function buildTableXML(elementId, xmlData) {
    var table, header, tbody, dataRows, element;

    // Start the table
    table = document.createElement("table");
    table.style.cssText = "width: 100%; text-align:center";

    header = createTableHeader();

    // Add header to table
    table.appendChild(header);

    // Create the table body
    tbody = document.createElement("tbody");

    // Parse the xml data
    dataRows = xmlData.getElementsByTagName(_schema.rowTag);

    for (var y = 0; y < dataRows.length; y++) {
        var dataRow, row;

        dataRow = dataRows[y];

        row = document.createElement("tr");

        for (var x = 0; x < _schema.columns.length; x++) {
            var col, tagName, cell, cellText, xmlElement;

            col = _schema.columns[x];
            tagName = col.tagName;
            cellText;

            // If the tagName is prefixed with "@" its an attribute
            if (tagName.charAt(0) == "@") {
                cellText = dataRow.getAttribute(tagName.substring(1));
            }
            else {
                xmlElement = dataRow.getElementsByTagName(tagName)[0];
                cellText = xmlElement.firstChild.data;
            }

            cell = document.createElement("td");
            cell.appendChild(document.createTextNode(cellText));
            row.appendChild(cell);
        }

        tbody.appendChild(row);

    }

    table.appendChild(tbody);

    var element = document.getElementById(elementId);
    element.appendChild(table);
}

// Builds an html table from the _jsonData object
function buildTableJSON(elementId) {
    var table, header, tbody, element, oldTable;

    // Start the table
    table = document.createElement("table");
    table.style.cssText = "width: 100%; text-align:center";

    table.id = "jsonData";

    // Add header
    header = createTableHeader();

    table.appendChild(header);

    tbody = document.createElement('tbody');

    for (var d in _jsonData.date) {
        var date, row;

        date = _jsonData.date[d];

        row = document.createElement('tr');

        for (var x = 0; x < _schema.columns.length; x++) {
            var col, tagName, cell, cellText;

            col = _schema.columns[x];
            tagName = col.tagName;

            cellText = date[tagName];

            cell = document.createElement('td');
            cell.appendChild(document.createTextNode(cellText));
            row.appendChild(cell);
        }

        tbody.appendChild(row);
    }

    table.appendChild(tbody);

    
    element = document.getElementById(elementId);

    // Remove old table (if it exists)
    oldTable = document.getElementById(table.id);

    if (oldTable != null) {
        element.removeChild(oldTable);
    }

    element.appendChild(table);
}

// Converts XML to JSON, uses recursion
function xml2Json(xmlData) {
    var obj;

    // If we have a document get the first node
    if (xmlData.nodeType == 9) {
        xmlData = xmlData.firstChild;
    }

    // Add attributes
    if (xmlData.nodeType == 1) {
        for (var x = 0; x < xmlData.attributes.length; x++) {
            var attr;

            if (obj == undefined){
                obj = new Object();
            }
            attr = xmlData.attributes[x];
            obj['@' + attr.name] = attr.value;
        }
    }
    // Node is text
    if (xmlData.nodeType == 3) {
        obj = xmlData.nodeValue;
        //return obj;
    }

    // Process child nodes
    for (var x = 0; x < xmlData.childNodes.length; x++) {
        var currChild, nodeName;

        currChild = xmlData.childNodes[x];
        nodeName = currChild.nodeName;

        if (obj !== undefined) {
            if (!isArray(obj[nodeName])) {
                obj[nodeName] = arguments.callee(currChild);

                // If the current node has descendents with the same name
                // convert object to array
                if (xmlData.getElementsByTagName(nodeName).length > 1) {
                    var tmpObj;
                    
                    tmpObj = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(tmpObj);
                }
            }
            else {
                obj[nodeName].push(arguments.callee(currChild));
            }
        }
        else {
            obj = currChild.nodeValue;
        }
    }

    return obj;
}

// Draws the peak flow chart.  The origin (0,0) in Canvas is the top-left corner. Values increase moving
// to the right and down.
function drawChart() {
    
    var leftX, rightX, topY, bottomY, chartWidth;

    chartWidth = 480;
    // Left most boundary of chart x-axis
    leftX = 80;
    // Bottom boundary of chart y-axis
    bottomY = 400;
    // Top boundary of y-axis
    topY = 20;

    // Clear any existing graphics from the canvas
    _context.clearRect( 0 , 0 , _chart.width , _chart.height );

    // This also clears any existant paths
    _context.beginPath();

    drawAxes(leftX, topY, bottomY, chartWidth);
    drawLabels(leftX, chartWidth);
    drawDataPoints(leftX, topY, bottomY, chartWidth);
}

// Draws the axes for the chart
function drawAxes(leftX, topY, bottomY, chartWidth) {
    var rightX;

    rightX = leftX + chartWidth;

    // Y axis
    _context.moveTo(leftX, topY);
    _context.lineTo(leftX, bottomY);

    // Y arrow
    _context.moveTo(leftX, topY);
    _context.lineTo(leftX + 5, topY + 5);
    _context.moveTo(leftX, topY);
    _context.lineTo(leftX - 5, topY + 5);

    // X axis
    _context.moveTo(leftX, bottomY);
    _context.lineTo(rightX, bottomY);

    // X arrow
    _context.moveTo(rightX, bottomY);
    _context.lineTo(rightX - 5, bottomY + 5);
    _context.moveTo(rightX, bottomY);
    _context.lineTo(rightX - 5, bottomY - 5);

    // Fill the lines
    _context.strokeStyle = "#000";
    _context.stroke();
}

// Draws the labels and horizontal grid lines for the chart
function drawLabels(leftX, chartWidth) {
    var height, width, y;

    height = _context.canvas.height;
    width = _context.canvas.width;
    middle = width / 2;

    _context.font = "bold 18px sans-serif";
    _context.fillText("Date", middle - 20, height - 20);
    _context.fillText("Peak Flow by Date (Liters/Minute)", middle - 150, height - 460);

    y = 100;
    _context.font = "12px sans-serif";
    for (var i = 200; i <= 600; i = i + 50) {
        _context.fillText(i, leftX - 25, height - y);
        _context.moveTo(leftX, height - y);
        _context.lineTo(leftX + chartWidth, height - y);

        y = y + 40;
    }

    _context.strokeStyle = "#000";
    _context.stroke();
}

// Charts the data from _jsonData
function drawDataPoints(leftX, topY, bottomY, chartWidth) {
    var height, heightOffset, dpInc, dpOffset, dpLblSpacing, graphBase, 
        graphHeight, scaleFactor, startPoint;
    
    height = _context.canvas.height;
    heightOffset = 60;
    
    // The y values for our graph start at 180
    graphBase = 180;
    // The y values for our graph end at 650
    graphHeight = 650

    // Need to scale our data to the graph.  The size (pixels) of the y axis of our graph divided by the range of values
    scaleFactor = (_chart.height - (topY + (_chart.height - bottomY))) / (graphHeight - graphBase);

    // Data point offset increment is the chart width divided by the number of records
    dpInc = chartWidth / _jsonData.date.length;

    // Need another factor to shif the labels left
    dpLblSpacing = (dpInc / 2);

    dpOffset = dpInc;

    startPoint = true;

    for (var d in _jsonData.date) {
        var date, startPoint;

        date = _jsonData.date[d];

        for (var x = 0; x < _schema.columns.length; x++) {
            var col, tagName, point;

            col = _schema.columns[x];
            tagName = col.tagName;

            // See if we've got our x axis label
            if (tagName.indexOf("@") > -1) {
                _context.fillText(date[tagName], leftX + dpOffset - dpLblSpacing, height - heightOffset);
            }
            else {
                if (date[tagName] !== undefined && date[tagName] != "")
                { 
                    point = (date[tagName] - graphBase) * scaleFactor;

                    // First point we start the path and move to it.
                    if (startPoint) {
                        _context.beginPath();
                        _context.moveTo(leftX + dpOffset - dpLblSpacing, bottomY - point);
                        // Draw a point.
                        _context.arc(leftX + dpOffset - dpLblSpacing, bottomY - point, 1.5, 0, 2 * Math.PI, true);
                        startPoint = false;
                    }
                    else {
                        // Be sure to draw morning and evening readings with some space inbetween
                        if (tagName == "morning") {
                            _context.lineTo(leftX + dpOffset - dpLblSpacing, bottomY - point);
                            // Draw a point for the data
                            _context.arc(leftX + dpOffset - dpLblSpacing, bottomY - point, 1.5, 0, 2 * Math.PI, true);
                        }
                        else {
                            _context.lineTo(leftX + dpOffset, bottomY - point);
                            _context.arc(leftX + dpOffset, bottomY - point, 1.5, 0, 2 * Math.PI, true);
                        }
                    }
                }
            }
        }

        // Fill the lines
        _context.strokeStyle = "#000";
        _context.stroke();

        // Make sure we scale the points down the axis
        dpOffset += dpInc;
    }
}

// This function checks to see if the supplied object is an array type
function isArray(obj) {
    if (obj === undefined) {
        return false;
    }
    return Object.prototype.toString.call(obj) === '[object Array]';
}

// Updates the data in _jsonObject with the submitted data
function updateData() {
    var inputData, newDate, oldDate, oldDateIdx; 

    oldDateIdx = -1;

    // Collect our inputs
    inputData = new Object();

    inputData.date = document.getElementById('sDate').value;
    inputData.reading = document.getElementById('sReading').value;
    inputData.timeOfDay = getTimeOfDay();

    // Validate inputs
    if (validInputs(inputData) == true) {

        for(var d in _jsonData.date){
            var date;

            date = _jsonData.date[d];

            if (date["@mmddyyyy"] == inputData.date){
                oldDateIdx = d;
                // found, we're done here
                break;
            }
        }

        // Update existing record
        if (oldDateIdx > -1) {
            oldDate = _jsonData.date[oldDateIdx];
            oldDate[inputData.timeOfDay] = inputData.reading;
        }
        else {
            newDate = new Object();
            newDate["@mmddyyyy"]=inputData.date;
            newDate.morning = "";
            newDate.evening = "";

            newDate[inputData.timeOfDay] = inputData.reading;

            _jsonData.date.push(newDate);
        }

        // Sort _jsonData
        dateBubbleSort();

        // update table
        buildTableJSON('tableJSON');
        // update chart
        drawChart();
    }
}

// Validates the inputs from the peak flow form
function validInputs(inputData) {
    var dateRegex, dateValid, validationMsg, readingMax, readingMin;

    validationMsg = "";
    readingMax = 800;
    readingMin = 100;

    // Checks for mm/dd/yyyy
    dateRegex = /^(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\d\d$/;

    dateValid = inputData.date.search(dateRegex);

    if (dateValid == -1){
        validationMsg += "Date must be in format mm/dd/yyyy. \n";
    }

    if (inputData.reading < readingMin || inputData.reading > readingMax){
        validationMsg += "Peak flow reading must be between "+readingMin+" and "+readingMax+". \n";
    }

    if (inputData.timeOfDay == "unchecked") {
        validationMsg += "Please select a time of day.";
    }

    if (validationMsg.length > 0){
        alert(validationMsg);
        return false;
    }

    return true;
}

// Bubble sort for _jsonData
function dateBubbleSort() {
    var tmpJsonData;

    tmpJsonData = _jsonData;
    for (var i = 0; i < _jsonData.date.length; i++){
        for (var j = _jsonData.date.length - 1; j > i; j--) {
            var date, adjDate, tmpDate;

            date = _jsonData.date[j];
            adjDate = _jsonData.date[j-1];

            // Parse or convert the dates to the javascript Date object for comparison
            dateObj = parseDate(date["@mmddyyyy"]);
            adjDateObj = parseDate(adjDate["@mmddyyyy"]);

            if (dateObj < adjDateObj) {
                // swap j-1 and j
                _jsonData.date.splice(j,1);
                _jsonData.date.splice(j-1,0,date);
            } 
        }
    }
}

// Parses the date string used in peak flow to the javascript Date object
function parseDate(dateString){
    var splitDate, date;

    splitDate = dateString.split("/");

    date = new Date(splitDate[2],splitDate[0],splitDate[1]);

    var i = 10;

    return date;
}

// Get the value of the time of day radio button
function getTimeOfDay() {
    var timeOfDay, rMorning, rEvening;

    rMorning = document.getElementById('rMorning');
    rEvening = document.getElementById('rEvening');

    if (rMorning.checked == true) {
        timeOfDay = rMorning.value;
    }
    else if (rEvening.checked == true) {
        timeOfDay = rEvening.value;
    }
    else {
        timeOfDay = "unchecked";
    }

    return timeOfDay;
}

return _updateData;
}

var peakFlowSubmit = new peakFlow();