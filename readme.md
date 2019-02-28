# Data Visualization

<img src="https://d3js.org/logo.svg" align="left">

This project shows my efforts to create data driven visualizations on web pages using JavaScript's D3 (<b>D</b>ata <b>D</b>riven <b>D</b>ocuments) library. My goal is to create reusable, customizable, informative visualizations that are responsive to user interaction and usable in a production environment.

The following topics will be covered over the course of this project:

* Pie Chart
* Spatial Data (geoJSON)
* Time Series

## Pie Chart

A multi level, drill down pie chart to explore the composition of your nested data set.

Features:

* displays any nested data set
* not limited by the number of levels
* drill down by clicking the pie slice or the legend entry
* drill up by clicking the BACK-Button
* hover and click transitions make the chart feel responsive
* a tool tip displays information on currently hovered data subset
* 9 different color ramps

Some features can be turned on or off at will by setting their values to either <b>true</b> or <b>false</b> in the config.

Optional features:

* add a heading above the chart that displays the label of the current level
* show a legend that matches the content currently displayed in the pie chart
* trigger a transition on a legend entry when hovering the corresponding pie slice in the chart
* display labels at the center the pie slices
* truncate overly long legend labels ('this_is_a_long_la...') when not hovered
