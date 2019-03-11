# Data Visualization

<img src="https://d3js.org/logo.svg" align="left">

This project shows my efforts to create data driven visualizations on web pages using JavaScript's D3 (<b>D</b>ata <b>D</b>riven <b>D</b>ocuments) library. My goal is to create reusable, customizable, informative visualizations that are responsive to user interaction and usable in a production environment.

The following types of visualizations will be covered over the course of this project:

* [x] Pie Charts
* [ ] Spatial Data
* [ ] Time Series

## Pie Chart Summary

A multi level, drill down pie chart to explore the composition of nested data sets.

### Demo
<p align="center">
    <img src="https://i.imgur.com/gjX87Ey.gif" align="center">
</p>

### Features

* displays any nested data set
* drill down by clicking the pie slice or the legend entry
* drill up by clicking the back-button
* hover and click transitions make the chart feel responsive
* a tooltip displays information on currently hovered data subset
* different color ranges

Some features can be turned on or off at will by setting their values to either <i>true</i> or <i>false</i> in the config in the /pie-chart/main.js file.

#### Optional Features

* add a heading above the chart that displays the label of the current level
* show a legend for the displayed data
* trigger a transition on a legend entry when hovering the corresponding pie slice
* display labels around the chart
* truncate overly long legend labels ('This is a long la...') when not hovered
