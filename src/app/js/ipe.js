"use strict";

/** 
 * This class handles generation of an IPE (xml) file to be exported
 */
class IPE {
  constructor() {
    this.fileLink = document.getElementById("fileLink"); // invisible link that is automatically triggered to start download of the IPE generated file
  }

  /**
   * Given the list of robots and the iteration, process all this information into a IPE-compatible file that is automatically downloaded
   * 
   * @param {Array} robots list of robots of the iteration selected
   * @param {String} iter iteration selected ("001", "002", etc.)
   */
  exportToIPE(robots, iter) {
    const now = this.formatCurrentTime(new Date());
    const fileName = `${iter}-${now}.ipe`;
    const robotsXML = [...robots].map(([, {position: {x: absX}, data: {localPosition: {x, y=0}, faulty, label: {content}}}]) => {
      // in 1D, `localPosition` is not informative (because the origin is not always at the same place)
      // we need to rely on the absolute position of the robots
      if (canvasScript.is1d()) {
        x = absX - canvasScript.MIN_X;
      }

      // faulty: draw a black disk
      if (faulty) {
        return `<use name="mark/disk(sx)" pos="${x} ${y}" size="large" stroke="black"/>`;
      }

      // non-faulty: draw a white disk
      return `<use name="mark/fdisk(sfx)" pos="${x} ${y}" size="large" stroke="black" fill="white"/>`;
    });

    // create a Blob, then a little hack to automatically download the IPE file
    const ipeBlob = this.generateIPEBlob(robotsXML, now);
    const url = window.URL.createObjectURL(ipeBlob);
    this.fileLink.href = url;
    this.fileLink.download = fileName;
    this.fileLink.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Format a string `YYYYMMDDHHmmSS` given a time object
   * 
   * @param {Date} now current time
   */
  formatCurrentTime(now) {
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    const hour = `${now.getHours()}`.padStart(2, '0');
    const minute = `${now.getMinutes()}`.padStart(2, '0');
    const second = `${now.getSeconds()}`.padStart(2, '0');

    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  /**
   * Generates a **Blob** containing the IPE file representing the list of robots provided
   * 
   * @param {Array} robotsXML list of SVG paths representing the robots and their labels
   * @param {String} nowStr formatted time
   */
  generateIPEBlob(robotsXML, nowStr) {
    // axes drawn vary depending on if it's in 1D or 2D
    const axes = canvasScript.is1d() ?
      `<path layer="alpha" stroke="black" pen="ultrafat">
      0 0 m
      1200 0 l
      </path>` :
      `<path layer="alpha" stroke="black" pen="ultrafat">
      0 500 m
      0 0 l
      1000 0 l
      </path>`

    // returns the whole Blob (`application/xml`)
    return new Blob([`<?xml version="1.0"?>
    <!DOCTYPE ipe SYSTEM "ipe.dtd">
    <ipe version="70206" creator="Ipe 7.2.7">
    <info created="D:${nowStr}" modified="D:${nowStr}"/>
    <ipestyle name="basic">
    <symbol name="mark/disk(sx)" transformations="translations">
    <path fill="sym-stroke">
    0.6 0 0 0.6 0 0 e
    </path>
    </symbol>
    <symbol name="mark/fdisk(sfx)" transformations="translations">
    <group>
    <path fill="sym-fill">
    0.5 0 0 0.5 0 0 e
    </path>
    <path fill="sym-stroke" fillrule="eofill">
    0.6 0 0 0.6 0 0 e
    0.4 0 0 0.4 0 0 e
    </path>
    </group>
    </symbol>
    <layout origin="-20 -20" paper="1300 600"  frame="1300 600"/>
    <pen name="heavier" value="0.8"/>
    <pen name="fat" value="1.2"/>
    <pen name="ultrafat" value="2"/>
    <symbolsize name="large" value="5"/>
    <symbolsize name="small" value="2"/>
    <symbolsize name="tiny" value="1.1"/>
    <arrowsize name="large" value="10"/>
    <arrowsize name="small" value="5"/>
    <arrowsize name="tiny" value="3"/>
    <color name="red" value="1 0 0"/>
    <color name="green" value="0 1 0"/>
    <color name="blue" value="0 0 1"/>
    <color name="yellow" value="1 1 0"/>
    <color name="orange" value="1 0.647 0"/>
    <color name="gold" value="1 0.843 0"/>
    <color name="purple" value="0.627 0.125 0.941"/>
    <color name="gray" value="0.745"/>
    <color name="brown" value="0.647 0.165 0.165"/>
    <color name="navy" value="0 0 0.502"/>
    <color name="pink" value="1 0.753 0.796"/>
    <color name="seagreen" value="0.18 0.545 0.341"/>
    <color name="turquoise" value="0.251 0.878 0.816"/>
    <color name="violet" value="0.933 0.51 0.933"/>
    <color name="darkblue" value="0 0 0.545"/>
    <color name="darkcyan" value="0 0.545 0.545"/>
    <color name="darkgray" value="0.663"/>
    <color name="darkgreen" value="0 0.392 0"/>
    <color name="darkmagenta" value="0.545 0 0.545"/>
    <color name="darkorange" value="1 0.549 0"/>
    <color name="darkred" value="0.545 0 0"/>
    <color name="lightblue" value="0.678 0.847 0.902"/>
    <color name="lightcyan" value="0.878 1 1"/>
    <color name="lightgray" value="0.827"/>
    <color name="lightgreen" value="0.565 0.933 0.565"/>
    <color name="lightyellow" value="1 1 0.878"/>
    <dashstyle name="dashed" value="[4] 0"/>
    <dashstyle name="dotted" value="[1 3] 0"/>
    <dashstyle name="dash dotted" value="[4 2 1 2] 0"/>
    <dashstyle name="dash dot dotted" value="[4 2 1 2 1 2] 0"/>
    <textsize name="large" value="\\large"/>
    <textsize name="Large" value="\\Large"/>
    <textsize name="LARGE" value="\\LARGE"/>
    <textsize name="huge" value="\\huge"/>
    <textsize name="Huge" value="\\Huge"/>
    <textsize name="small" value="\\small"/>
    <textsize name="footnote" value="\\footnotesize"/>
    <textsize name="tiny" value="\\tiny"/>
    <textstyle name="center" begin="\\begin{center}" end="\\end{center}"/>
    <textstyle name="itemize" begin="\\begin{itemize}" end="\\end{itemize}"/>
    <textstyle name="item" begin="\\begin{itemize}\\item{}" end="\\end{itemize}"/>
    <gridsize name="4 pts" value="4"/>
    <gridsize name="8 pts (~3 mm)" value="8"/>
    <gridsize name="16 pts (~6 mm)" value="16"/>
    <gridsize name="32 pts (~12 mm)" value="32"/>
    <gridsize name="10 pts (~3.5 mm)" value="10"/>
    <gridsize name="20 pts (~7 mm)" value="20"/>
    <gridsize name="14 pts (~5 mm)" value="14"/>
    <gridsize name="28 pts (~10 mm)" value="28"/>
    <gridsize name="56 pts (~20 mm)" value="56"/>
    <anglesize name="90 deg" value="90"/>
    <anglesize name="60 deg" value="60"/>
    <anglesize name="45 deg" value="45"/>
    <anglesize name="30 deg" value="30"/>
    <anglesize name="22.5 deg" value="22.5"/>
    <opacity name="10%" value="0.1"/>
    <opacity name="30%" value="0.3"/>
    <opacity name="50%" value="0.5"/>
    <opacity name="75%" value="0.75"/>
    <tiling name="falling" angle="-60" step="4" width="1"/>
    <tiling name="rising" angle="30" step="4" width="1"/>
    </ipestyle>
    <page>
    <layer name="alpha"/>
    <view layers="alpha" active="alpha"/>
    ${axes}
    ${robotsXML.join("\n")}
    </page>
    </ipe>
    `], {
      type: "application/xml",
    });
  }
}

let ipe = new IPE();
