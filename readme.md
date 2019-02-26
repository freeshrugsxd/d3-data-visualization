# Data Visualization

<img src="https://d3js.org/logo.svg" align="left">

In this project I trying to create data driven visualizations on a web page using JavaScript's D3 library.

My aim is to make them reusable, customizable, informative and responsive to user interaction.

There are three particular types of visualization that we will cover.

These are:

* Pie Chart
* geoJSON
* Time Series

## Pie Chart

A multi level, drill down pie chart.

Features:

* displays any nested dataset
* no limitation to number of levels
* drill down by clicking the pie slice or the legend entry
* drill up by clicking the BACK-Button
* hover and click transitions makes the chart feel responsive
* tool tip displays information on currently hovered data subset
* 9 different color ramps

Some features can be turned on or off at will by setting their values to true or false in the config.

Optional features:

* display a heading shows the name of the current level
* display a legend
* display labels inside the pie slices
* play a transition on the legend entry when hovering the corresponding pie slice in the chart

