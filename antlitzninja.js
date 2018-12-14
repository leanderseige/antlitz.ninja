/*

  ANTLITZ.NINJA

  (c) 2018, Leander Seige, leander@seige.name

  https://antlitz.ninja
	https://github.com/leanderseige/antlitz.ninja

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.

*/

function antlitzninja(config) {

  var setup_template = {
    id: "",
    preserveViewport: true,
    visibilityRatio: 1,
    minZoomLevel: 1,
    defaultZoomLevel: 1,
    sequenceMode: false,
    showNavigationControl: false,
    crossOriginPolicy: "Anonymous",
    zoomPerScroll: 1,
    zoomPerSecond: 0,
    prefixUrl: "openseadragon/images/",
    tileSources: []
  };

  var osde = {
    "viewer": false,
    "x": 0,
    "y": 0,
    "w": 0,
    "h": 0
  };
  var osdn = {
    "viewer": false,
    "x": 0,
    "y": 0,
    "w": 0,
    "h": 0
  };
  var osdm = {
    "viewer": false,
    "x": 0,
    "y": 0,
    "w": 0,
    "h": 0
  };

  var osd = [];

  var manifests = [];
  var faces = [];
  var collections = [];

  var flag_changed = false;

  var download_mode = false;

  var eecnt = 0;

  var jcache = {};

  $(document).ready(function() {
    console.log("antlitz.ninja waking up");

    osd['e'] = osde;
    osd['n'] = osdn;
    osd['m'] = osdm;

    $("#impressum").hide();
    $("#settings").hide();

    load_data();

    eecnt=2;
    av.ee();

  })

  antlitzninja.prototype.recalcVH = function() {
    // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
    let vh = window.innerHeight * 0.01;
    // Then we set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    window.scrollTo(0,1);

  }

  async function load_data() {
    var uid = "";
    var url = "";

    url = "https://iiif.manducus.net/annotations/antlitz_faces_staedel.json";
    uid = b64EncodeUnicode(url);
    collections[uid] = [];
    collections[uid]['name'] = "Städel Museum, Frankfurt am Main";
    collections[uid]['lic'] = "CC-BY-SA 4.0";
    collections[uid]['url'] = url;
    collections[uid]['active'] = true;
    collections[uid]['json'] = false;
    collections[uid]['logo'] = "images/staedelmuseum-ed.svg";

    url = "https://iiif.manducus.net/annotations/antlitz_faces_met.json";
    uid = b64EncodeUnicode(url);
    collections[uid] = [];
    collections[uid]['name'] = "The Metropolitan Museum of Art, New York";
    collections[uid]['lic'] = "Public Domain";
    collections[uid]['url'] = url;
    collections[uid]['active'] = true;
    collections[uid]['json'] = false;
    collections[uid]['logo'] = "images/met.jpeg";

    url = "https://iiif.manducus.net/annotations/antlitz_faces_nga.json";
    uid = b64EncodeUnicode(url);
    collections[uid] = [];
    collections[uid]['name'] = "Courtesy National Gallery of Art, Washington";
    collections[uid]['lic'] = "Public Domain";
    collections[uid]['url'] = url;
    collections[uid]['active'] = true;
    collections[uid]['json'] = false;
    collections[uid]['logo'] = "images/nga.png";

    // LOAD ALL MANIFESTS
    // switched to async by intention

    await loadAllData();

  }

  async function get_cached_url(url) {
    var key = b64EncodeUnicode(url);
    if(key in jcache) {
      return jcache[key];
    }
    const mresp = await fetch(url);
    const mresu = await mresp.json();
    jcache[key] = mresu;
    return mresu;
  }

  async function loadAllData() {
    var n = 0;
    for (var c in collections) {
      const cresp = await fetch(collections[c]['url']);
      const cresu = await cresp.json();
      collections[c]['json'] = cresu;
      n = n + cresu['resources'].length;
      console.log("inc " + n)
    }
    $('#loader_msg').html(n);
    for (var c in collections) {
      for (var r in collections[c]['json']["resources"]) {
        var mresu = await get_cached_url(collections[c]['json']['resources'][r]['on']['within']['@id']);
        var id = b64EncodeUnicode(mresu['@id']);
        console.log(id);
        manifests[id] = mresu;
        $('#loader_msg').html(--n + " to go...");
      }
    }
    $('#loader_msg').html("");
    console.log("boarding completed");
    av.hide('#splash');
    init_display();
  }

  async function getAllUrls(urls) {
    try {
      var data = await Promise.all(
        urls.map(
          url =>
          fetch(url).then(
            (response) => response.json()
          )));

      return (data)

    } catch (error) {
      console.log(error)

      throw (error)
    }
  }

  var traverse = function(o, fn) {
    for (var i in o) {
      fn.apply(this, [i, o[i]]);
      if (o[i] !== null && typeof(o[i]) == "object") {
        traverse(o[i], fn);
      }
    }
  }

  function build_faces() {
    faces = [];
    var fid = 0;
    for (c in collections) {
      console.log(collections[c]);
      if (collections[c]['active']) {
        for (var r in collections[c]['json']['resources']) {
          console.log(r);
          var face = [];
          var resources = collections[c]['json']['resources'];
          var temp = resources[r]['on']['@id'].split('#');
          // console.log(temp);
          var mf = resources[r]['on']['within']['@id'];
          mf = b64EncodeUnicode(mf);
          traverse(manifests[mf], function(k, v) {
            if (v['@id'] == temp[0]) {
              face['image'] = v['images'][0]['resource']['service']['@id'];
              face['title'] = v['label'];
            }
          });
          temp = temp[1].replace("xywh=", "").split(',');
          face['x'] = parseInt(temp[0]);
          face['y'] = parseInt(temp[1]);
          face['w'] = parseInt(temp[2]);
          face['h'] = parseInt(temp[3]);
          face['manifest'] = b64EncodeUnicode(resources[r]['on']['within']['@id']);
          face['logo'] = collections[c]['logo'];
          face['name'] = collections[c]['name'];
          face['collid'] = c;
          faces[fid] = face;
          fid = fid + 1;
        }
      }
      // console.log(faces);
    }
  }

  function init_display(result) {
    console.log("hi");
    console.log(collections);
    build_faces();
    loadOSD('e', true);
    loadOSD('n', true);
    loadOSD('m', true);
    $("#splash").hide();
    $("#loader").hide();
  }

  antlitzninja.prototype.reloadOSD = function(o) {
    loadOSD(o, true);
  }

  antlitzninja.prototype.resetAll = function() {
    loadOSD('e', false);
    loadOSD('n', false);
    loadOSD('m', false);
  }

  antlitzninja.prototype.reloadAll = function() {
    loadOSD('e', true);
    loadOSD('n', true);
    loadOSD('m', true);
  }

  function collect_metadata(fid) {
    var md = [];
    md['t'] = "";
    md['c'] = "";
    md['i'] = "";
    md['s'] = "";
    md['p'] = false;
    var m = false;
    try {
      md['s'] = manifests[faces[fid]['manifest']].related[0];
    } catch (e) {}
    try {
      md['i'] = manifests[faces[fid]['manifest']]['@id'];
    } catch (e) {}
    try {
      m = manifests[faces[fid]['manifest']].metadata;
    } catch (e) {}
    for (var k in m) {
      if (m[k]['label'] == "Creator") {
        md['c'] = m[k]['value'];
      }
      if (m[k]['label'] == "Title") {
        md['t'] = m[k]['value'];
      }
      if (m[k]['label'] == "Manifest") {
        md['i'] = m[k]['value'];
      }
      if (m[k]['label'] == "Permalink") {
        md['p'] = m[k]['value'];
      }
    }
    if (md['t'] == false) {
      md['t'] = faces[fid]['title'];
    }
    return md;
  }

  function build_metadisplay(fid) {
    var md = collect_metadata(fid);
    var html = "";
    if (md['t'].length > 40) {
      md['t'] = md['t'].substring(0, 35) + " [...]"
    }
    html = html + "<strong>" + md['c'] + "</strong><br />" + md['t'] + '<br />';
    html = html + faces[fid]['name'] + "<br />";
    html = html + '<nobr>';
    html = html + '<a href="' + md['s'] + '" target="_blank" ><img class="linkon" src="' + faces[fid]['logo'] + '" /></a>'
    html = html + '<a href="' + md['i'] + '" target="_blank" ><img class="linkon" src="images/iiif.svg" /></a>'
    if (md['p']) {
      html = html + '<a href="' + md['p'] + '" target="_blank" ><img class="linkon" src="images/manducus.png" /></a>'
    }
    html = html + '</nobr>';
    html = html + '<br />';
    return html;
  }

  function combine_metadata() {
    var html = "";
    html = html + build_metadisplay(osde["fid"]);
    html = html + "<hr /><br />";
    html = html + build_metadisplay(osdn["fid"]);
    html = html + "<hr /><br />";
    html = html + build_metadisplay(osdm["fid"]);
    return html;
  }

  function build_metadata() {
    var html = "<div>";
    html = html + combine_metadata();
    html = html + '<span class="icons" style="color:black;" onclick="av.hide(\'#splash\');av.hide(\'#metadata\');">&#xf057;</span>';
    html = html + "</div>";
    $('#metadata').html(html);
  }

  function loadOSD(o, neu) {
    if (neu) {
      var fid = Math.floor(Math.random() * faces.length);
    } else {
      fid = osd[o]["fid"];
    }
    $.getJSON(faces[fid]['image'] + "/info.json", function(result) {
      // console.log(result);
      var setup = setup_template;
      setup.tileSources[0] = result;
      setup.id = config[o];
      if (osd[o]["viewer"]) {
        osd[o]["viewer"].close();
        document.getElementById(config[o]).innerHTML = "";
      }
      osd[o]["fid"] = fid;
      osd[o]["id"] = faces[fid]['image'];
      osd[o]["viewer"] = OpenSeadragon(setup);
      osd[o]["x"] = faces[fid]['x'];
      osd[o]["y"] = faces[fid]['y'];
      osd[o]["w"] = faces[fid]['w'];
      osd[o]["h"] = faces[fid]['h'];
      console.log(faces[fid])
      switch (o) {
        case 'e':
          osd[o]["h"] = osd[o]["h"] * 200 / 400;
          break;
        case 'n':
          osd[o]["y"] = osd[o]["y"] + osd[o]["h"] * 200 / 400;
          osd[o]["h"] = osd[o]["h"] * 80 / 400;
          break;
        case 'm':
          osd[o]["y"] = osd[o]["y"] + osd[o]["h"] * 280 / 400;
          osd[o]["h"] = osd[o]["h"] * 120 / 400;
          break;
      }
      // console.log(osd[o]);
      osd[o]["viewer"].addHandler("open", function(viewer) {
        var vr = osd[o]["viewer"].viewport.imageToViewportRectangle(osd[o]["x"], osd[o]["y"], osd[o]["w"], osd[o]["h"]);
        osd[o]["viewer"].viewport.fitBoundsWithConstraints(vr);
      })
      build_metadata();
    });
  }

  antlitzninja.prototype.flipOSD = function(o) {
    osd[o]["viewer"].viewport.setFlip(
      false === osd[o]["viewer"].viewport.getFlip()
    );
  }

  const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

  function wrapPDF(data) {
    var doc = new jsPDF();
    var c = 20;
    doc.setFontSize(16);
    doc.setFontType("bold");
    doc.text(30, c, 'ANTLITZ.NINJA'); c+=8;
    doc.setFontType("normal");
    doc.setFontSize(10);
    doc.setTextColor(127,127,127);
    doc.textWithLink('https://antlitz.ninja', 30, c, { url: 'https://antlitz.ninja' }); c+=12;
    doc.setTextColor(0,0,0);
    for(o in osd) {
      var fid = osd[o]['fid'];
      var md = collect_metadata(fid);
      doc.setFontSize(12);
      doc.setFontType("bold");
      doc.text(30, c, md['t']); c+=6;
      doc.setFontType("normal");
      doc.text(30, c, md['c']); c+=6;
      doc.setFontSize(10);
      doc.setTextColor(127,127,127);
      doc.textWithLink(
        collections[faces[fid]['collid']]['name'] + ", " +
        collections[faces[fid]['collid']]['lic'],
        30, c, { url: md['s'] }
      ); c+=6;
      doc.textWithLink('IIIF Manifest', 30, c, { url: md['i'] }); c+=4;
      if(md['p']) {
        doc.textWithLink('View on Manducus.net', 30, c, { url: md['p'] }); c+=4;
      }
      doc.setTextColor(0,0,0);
      c+=8;
    }
    // doc.addPage();
    doc.text(30, c, "Composed Image: CC-BY-SA 4.0");
    c+=6;
    doc.addImage(data, 'JPEG', 30, c, 120, 120);
    var ms = (new Date).getTime();
    doc.save("antlitz.ninja."+ ms.toString() +".pdf");
    $("#loader").hide();
    $("#splash").hide();
    console.log("finished image");
  }

  function finishDownload(data,fn) {
    var link = document.createElement('a');
    link.id = 'deleteme';
    // link = document.getElementById("download_button");
    link.href = data; // toDataURL('image/png');
    // link.target = "_blank";
    link.download = fn;

    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    var isFirefox = typeof InstallTrigger !== 'undefined';
    var isSafari = /constructor/i.test(window.HTMLElement) || (function(p) {
      return p.toString() === "[object SafariRemoteNotification]";
    })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
    var isIE = /*@cc_on!@*/ false || !!document.documentMode;
    var isEdge = !isIE && !!window.StyleMedia;
    var isChrome = !!window.chrome && !!window.chrome.webstore;
    var isBlink = (isChrome || isOpera) && !!window.CSS;

    if (isFirefox) {
      var event = new MouseEvent('click');
      link.dispatchEvent(event);
    } else {
      link.click();
    }

    av.hide("#loader");
    av.hide("#splash");
    console.log("finished image");
  }

  function create_image_compose(imge, imgn, imgm, w) {

    console.log("going to compose " + w);
    console.log(imge.src + " " + imge.complete);
    console.log(imgn.src + " " + imgn.complete);
    console.log(imgm.src + " " + imgm.complete);

    console.log("calculated width " + w);
    console.log("width e image " + imge.width);
    console.log("width n image " + imgn.width);
    console.log("width m image " + imgm.width);

    var dcanvas = document.createElement('canvas');
    dcanvas.id = "delme";
    dcanvas.width = w;
    dcanvas.height = w;

    console.log("canvas ready");
    var dctx = dcanvas.getContext("2d");
    console.log("d e");
    dctx.drawImage(imge, 0, 0, w, Math.ceil(w * 200 /400));
    console.log("d n");
    dctx.drawImage(imgn, 0, Math.floor(w * 200 / 400), w, Math.ceil(w * 80 / 400));
    console.log("d m");
    dctx.drawImage(imgm, 0, Math.floor(w * 280 / 400), w, Math.ceil(w * 120 / 400));

    var ms = (new Date).getTime();
    var fn = "antlitz.ninja." + ms.toString() + ".jpg";

    var data = dcanvas.toDataURL("image/jpeg", 0.98);

    /* FIXME we will have to remove those one day
    imge.remove();
    imgn.remove();
    imgm.remove();
    dcanvas.remove();
    */

    if (download_mode == "image") {
      finishDownload(data,fn);
    } else {
      wrapPDF(data);
    }

  }

  antlitzninja.prototype.launch_download_dialog = function () {
    av.show('#splash');
    av.show('#download');
    download_mode="manifest";
    this.create_image();
  }

  antlitzninja.prototype.downloadImage = function() {
    download_mode="image";
    $("#download").hide();
    $("#loader").show();
    this.create_image();
  }

  antlitzninja.prototype.downloadPDF = function() {
    download_mode="pdf";
    $("#download").hide();
    $("#loader").show();
    this.create_image();
  }

  antlitzninja.prototype.create_image = function() {
    var deleteme = document.getElementById('deleteme');
    if (deleteme) {
      deleteme.parentNode.removeChild(deleteme);
    }

    console.log("start");
    var verect = osde.viewer.viewport.viewportToImageRectangle(osde.viewer.viewport.getBounds());
    var veflip = osde.viewer.viewport.getFlip();
    var veimag = osde.id;

    var vnrect = osdn.viewer.viewport.viewportToImageRectangle(osdn.viewer.viewport.getBounds());
    var vnflip = osdn.viewer.viewport.getFlip();
    var vnimag = osdn.id;

    var vmrect = osdm.viewer.viewport.viewportToImageRectangle(osdm.viewer.viewport.getBounds());
    var vmflip = osdm.viewer.viewport.getFlip();
    var vmimag = osdm.id;

    var we = Math.round(verect.width);
    var wn = Math.round(vnrect.width);
    var wm = Math.round(vmrect.width);

    var w = we;
    if (wn > w) w = wn;
    if (wm > w) w = wm;

    var eimgurl = get_permalink(verect, veflip, veimag, w);
    var nimgurl = get_permalink(vnrect, vnflip, vnimag, w);
    var mimgurl = get_permalink(vmrect, vmflip, vmimag, w);

    if(download_mode=="manifest") {
      var m = JSONC.pack(create_dynafest(w,eimgurl,nimgurl,mimgurl));
      m = m.replace(/\//g, "%2F");
      m = m.replace(/\+/g, "%2B");
      $('#button_dynamic_manifest').attr("href", "https://antlitz.ninja./manifest.php?m="+m)
      return;
    }

    var imge = document.createElement('img');
    var imgn = document.createElement('img');
    var imgm = document.createElement('img');

    imge.crossOrigin = "Anonymous";
    imgn.crossOrigin = "Anonymous";
    imgm.crossOrigin = "Anonymous";

    console.log("loading "+eimgurl);
    imge.onload = function() {
      console.log("loading "+nimgurl);
      imgn.onload = function() {
        console.log("loading "+mimgurl);
        imgm.onload = function() {
          create_image_compose(imge, imgn, imgm, w);
        }
        imgm.src = mimgurl;
      }
      imgn.src = nimgurl;
    }
    imge.src = eimgurl;
  }

  function create_UUID(){
      var dt = new Date().getTime();
      var uuid = 'xxxx'.replace(/[xy]/g, function(c) {
          var r = (dt + Math.random()*16)%16 | 0;
          dt = Math.floor(dt/16);
          return (c=='x' ? r :(r&0x3|0x8)).toString(16);
      });
      return uuid;
  }

  // not used yet
  function create_dynafest(w,pe,pn,pm) {
    var id = create_UUID();
    var m = {};
    m['@context'] = "http://iiif.io/api/presentation/2/context.json";
    m['@type'] = "sc:Manifest";
    m['label'] = "";
    m['@id'] = 'https://'+id;
    var s = [];
    s[0] = {};
    s[0]['@type'] = "sc:Sequence";
    s[0]['@id'] = m['@id']+'/s/0';
    var c = [];
    c[0] = {}
    c[0]['@id'] = m['@id']+'/c/0';
    c[0]['@type'] = "sc:Canvas";
    c[0]['label'] = "";
    c[0]['height'] = w;
    c[0]['width'] = w;
    c[0]['thumbnail'] = {};
    c[0]['thumbnail']['@id'] = "https://antlitz.ninja/images/anth.png";
    var i = [];
    i[0] = {};
    i[0]['@id'] = m['@id']+'/i/0';
    i[0]['on'] = c[0]['@id']+"#xywh=0,0,100,50";
    i[0]['@type'] = "oa:Annotation";
    i[0]["@context"] = "http://iiif.io/api/presentation/2/context.json";
    i[0]['motivation'] = "sc:painting";
    i[0]['resource'] = {};
    i[0]['resource']['@id'] = pe;
    i[0]['resource']['@type'] =  "dctypes:Image";
    i[0]['resource']["format"] = "image/jpeg";

    i[1] = JSON.parse(JSON.stringify(i[0]));
    i[2] = JSON.parse(JSON.stringify(i[0]));
    i[1]['@id'] = m['@id']+'/i/1';
    i[2]['@id'] = m['@id']+'/0/2';
    i[1]['resource']['@id'] = pn;
    i[2]['resource']['@id'] = pm;

    i[1]['on'] = c[0]['@id']+"#xywh=0,50,100,20";
    i[2]['on'] = c[0]['@id']+"#xywh=0,70,100,30";

    c[0]['images'] = i;
    s[0]['canvases'] = c;
    m['sequences'] = s;

    return m;
  }

  function detectmob() {
    if (navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPad/i) ||
      navigator.userAgent.match(/iPod/i) ||
      navigator.userAgent.match(/BlackBerry/i) ||
      navigator.userAgent.match(/Windows Phone/i)
    ) {
      return true;
    } else {
      return false;
    }
  }

  function get_permalink(vrect, vflip, vimag, w) {
    var url = vimag;
    url = url + "/" + Math.floor(vrect.x) + "," + Math.floor(vrect.y) + "," + Math.ceil(vrect.width) + "," + Math.ceil(vrect.height + 1);
    url = url + "/" + w + "," + "/";
    if (vflip) {
      url = url + "!";
    }
    url = url + "0/default.jpg";
    return url;
  }

  antlitzninja.prototype.zoomIn = function(o) {
    osd[o].viewer.viewport.zoomTo(osd[o].viewer.viewport.getZoom() * 1.05);
  }

  antlitzninja.prototype.zoomOut = function(o) {
    osd[o].viewer.viewport.zoomTo(osd[o].viewer.viewport.getZoom() * 0.95);
  }

  antlitzninja.prototype.zoomInAll = function() {
    this.zoomIn('e');
    this.zoomIn('n');
    this.zoomIn('m');
  }

  antlitzninja.prototype.zoomOutAll = function() {
    this.zoomOut('e');
    this.zoomOut('n');
    this.zoomOut('m');
  }

  function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
  }

  antlitzninja.prototype.toggleCollection = function(cc) {
    flag_changed = true;
    var c = cc.replace(/\-/g, "=");
    console.log(cc + " > " + c);
    collections[c]['active'] = (collections[c]['active'] == true ? false : true);
    if (collections[c]['active']) {
      $("#CID-" + cc).html("&#xf205;");
    } else {
      $("#CID-" + cc).html("&#xf204;");
    }
  }

  antlitzninja.prototype.reloadFaces = function() {
    if (flag_changed) {
      build_faces();
      this.reloadAll();
    }
    this.hideSettings();
  }

  antlitzninja.prototype.hideSettings = function() {
    av.hide('#splash');
    av.hide('#settings');
  }

  antlitzninja.prototype.buildSettings = function() {
    flag_changed = false;
    var html = "";
    for (c in collections) {
      html = html + '<img class="linkon" src="' + collections[c]['logo'] + '" />';
      html = html + "<br />";
      html = html + "<span>" + collections[c]['name'] + "</span>";
      var cc = c.replace(/\=/g, "-");
      html = html + '<span class="icons mainmenu" id="CID-' + cc + '" onclick="av.toggleCollection(\'' + cc + '\');">';
      html = html + (collections[c]['active'] == true ? "&#xf205;" : "&#xf204;");
      html = html + "</span>";
      html = html + "<br /><br />";

    }
    html = html + "<span class=\"icons\" style=\"color:black;\" id=\"settingsok\" onclick=\"av.reloadFaces();\">&#xf058;</span>";
    html = html + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
    html = html + "<span class=\"icons\" style=\"color:black;\" onclick=\"av.hideSettings();\">&#xf057;</span>";

    $('#settings').html(html);
    av.show('#splash');
    av.show('#settings');
  }

  antlitzninja.prototype.ee = function() {
    eecnt = eecnt +1;
    if(eecnt==3) {
      $('#bottom').prepend('<div class="icons mainmenu" id="eesettings" onclick="av.buildSettings();">&#xf013;</div>');
      $('#eesettings').css("display", "block");
    }
  }

  antlitzninja.prototype.show = function(id) {
    $(id).fadeIn(500,function() {
      $(id).show();
    });
  }

  antlitzninja.prototype.hide = function(id) {
    $(id).fadeOut(500,function() {
      $(id).hide();
    });
  }


}
