# faulty-robots-simulation

## Research project to visualize behaviour of robots (possibly faulty) running the point-convergence algorithm

### User Features
* View
  * Zoom-in the view with `z`
  * Zoom-out of the view with `x`
  * Move around the view with the arrows
* During setup
  * `click` on the axis to spawn a robot
  * `Shift + click` on the axis to spawn a faulty robot
  * Drag a robot on the axis to change its position
  * Drag the "range" meter to change the range of vision of robots
    * Specific range can be input in the text input above
* Generating
  * To start generating, click on "Generate"
    * Only allowed if at least 2 robots present
  * Subsequent generations by pressing `Enter`
    * Newest generation shown at bottom
* Robot info
  * `double-click` on a robot to show/hide its info
    * info includes coordinates, label, status
  * Change precisely the position of the robot in the text input below the label
    * **ONLY DURING SETUP**
  * Delete a robot by clicking "Delete"
    * **ONLY DURING SETUP**
  * Toggle status of the robot (faulty or not) by clicking on the label
    * **ONLY DURING SETUP**
