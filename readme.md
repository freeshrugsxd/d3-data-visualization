# Data Visualization

<img src="https://d3js.org/logo.svg" align="left">

This project shows my efforts to create data driven visualizations on web pages using JavaScript's D3 (<u>D</u>ata <u>D</u>riven <u>D</u>ocuments) library. My goal is to create reusable, customizable, informative visualizations that are responsive to user interaction and usable in a production environment

The following topics will

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
* overly long labels are truncated ("this_is_a_long_la...") but shown in full when hovered
*

Some features can be turned on or off at will by setting their values to either <b>true</b> or <b>false</b> in the config.

Optional features:

* add a heading above the chart that displays the label of the current level
* show a legend that matches the content currently displayed in the pie chart
* trigger a transition on a legend entry when hovering the corresponding pie slice in the chart
* display labels at the center the pie slices

#### Pie Chart Dimensions

The size of the chart depends on the width of it's div container. The radius (outerRadius) is the difference of the width minus the left and right margins, divided by 2. The height of the svg element is in return calculated from the radius by doubling it and adding the top and bottom margins.