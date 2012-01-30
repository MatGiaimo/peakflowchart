			PeakFlow Chart
		Copyright (c) 2012 Mathew Giaimo

What is it?
-----------

PeakFlow chart is an application that can be used by anyone to plot peak
flow measurements.  Peak expiratory flow or PEF is a person's maximum speed
of expiration as measured by a peak flow meter.  Peak flow monitoring may
benefit people with asthma in addition to monitoring symptoms and frequency
of medication use.

This application provides code samples that demonstrate algorithms and operations
that are useful in JavaScript including:

-Reading data from an XML file
-Building HTML tables from XML and JSON data
-Converting XML data to JSON
-Data driven chart drawing with Canvas (HTML5)
-Bubble sort of an array of JavaScript objects
-Input validation

License and author
------------------

This application is distributed under the MIT license.

Contact the author at mgiaimo@gmail.com

Other open source software by the author:

OpenVisualization: Webservice based charting 
http://code.google.com/p/openvisualization/

TripleThreatWF: object-oriented workflow management system
http://code.google.com/p/triplethreatwf/


Running the application
-----------------------

Open PeakFlowChart.html in an HTML5 compatible browser.
This application has been tested in the following web browsers:

-Chrome 16.0.912.77 m 
(Windows 7, close any running instances and start with: chrome -allow-file-access-from-files)

-FireFox 3.6.3 (windows 7)
-Safari 5.1.2 (OS X Snow Leopard)

*The application will attempt to load a data file from the local file system.
Some browsers block this operation and treat it as a cross-domain request.

Ideally this application would run as a hosted web application and save/read data
via web services.

Code sample highlights
----------------------

Converting XML to JSON
----------------------

// Converts XML to JSON
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


Plotting data points from a JSON object using Canvas
----------------------------------------------------

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

Bubble sort of array of JavaScript objects by Date property
-----------------------------------------------------------

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

Building an HTML table from JavaScript objects
----------------------------------------------

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

