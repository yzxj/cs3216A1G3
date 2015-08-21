
/************************ PAGE INITIALISATION *************************/
$(function(){
	$("#fontFamily").change(function() {
		setActiveProp("fontFamily", $("#fontFamily").val());
	});
	$("#textAlign").change(function() {
		setActiveProp('textAlign', $("#textAlign").val());
	});
});

if (window.location.href.indexOf('#_=_') > 0) {
	window.location = window.location.href.replace(/#.*/, '');
}






/************************ GLOBAL VARIABLES *************************/
var canvas;
var bgselected;				// Image ID setter for background
var fntcolor = '#000000';	// Colour setter for new text
var blkcolor = '#FFFFFF';	// Colour setter for new block
var orig;					// Holds last selected/modified object (for clone)
var atLimit;				// Holds last acceptable position
var lastSave;				// Holds last save state (for undo)
var currSave;				// Holds current state (for redo)
var isSaved;				// Counter for whether changes have been made
var idleTime = 0;			// Counter for number of minutes user is idle
var idleInterval;			// Holds ID for setInterval() idle timer (for reset)






/************************ BOARD INITIALISATION *************************/
// Self Invoking / Init function
(function() {
  var $ = function(id){return document.getElementById(id)};

  canvas = this.__canvas = new fabric.Canvas('canvas', {
    isDrawingMode: true,
    selection: false
  });

  initEdit();
  resetInfoWin();
  //promptBoardEmpty();
  initColPickers();

  /***** Sets up Free Drawing *****/

  fabric.Object.prototype.transparentCorners = false;

  var drawingModeEl = $('drawing-mode'),
      drawingOptionsEl = $('drawing-mode-options'),
      drawingColorEl = $('drawing-color'),
      drawingShadowColorEl = $('drawing-shadow-color'),
      drawingLineWidthEl = $('drawing-line-width'),
      drawingShadowWidth = $('drawing-shadow-width'),
      drawingShadowOffset = $('drawing-shadow-offset');
      // clearEl = $('clear-canvas');

  // clearEl.onclick = function() { canvas.clear() };

  drawingModeEl.onclick = function() {
    canvas.isDrawingMode = !canvas.isDrawingMode;
    if (canvas.isDrawingMode) {
      drawingModeEl.innerHTML = 'Cancel drawing mode';
      drawingOptionsEl.style.display = '';
    }
    else {
      drawingModeEl.innerHTML = 'Enter drawing mode';
      drawingOptionsEl.style.display = 'none';
    }
  };

  if (fabric.PatternBrush) {
    var vLinePatternBrush = new fabric.PatternBrush(canvas);
    vLinePatternBrush.getPatternSrc = function() {

      var patternCanvas = fabric.document.createElement('canvas');
      patternCanvas.width = patternCanvas.height = 10;
      var ctx = patternCanvas.getContext('2d');

      ctx.strokeStyle = this.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.lineTo(10, 5);
      ctx.closePath();
      ctx.stroke();

      return patternCanvas;
    };

    var hLinePatternBrush = new fabric.PatternBrush(canvas);
    hLinePatternBrush.getPatternSrc = function() {

      var patternCanvas = fabric.document.createElement('canvas');
      patternCanvas.width = patternCanvas.height = 10;
      var ctx = patternCanvas.getContext('2d');

      ctx.strokeStyle = this.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(5, 10);
      ctx.closePath();
      ctx.stroke();

      return patternCanvas;
    };

    var squarePatternBrush = new fabric.PatternBrush(canvas);
    squarePatternBrush.getPatternSrc = function() {

      var squareWidth = 10, squareDistance = 2;

      var patternCanvas = fabric.document.createElement('canvas');
      patternCanvas.width = patternCanvas.height = squareWidth + squareDistance;
      var ctx = patternCanvas.getContext('2d');

      ctx.fillStyle = this.color;
      ctx.fillRect(0, 0, squareWidth, squareWidth);

      return patternCanvas;
    };

    var diamondPatternBrush = new fabric.PatternBrush(canvas);
    diamondPatternBrush.getPatternSrc = function() {

      var squareWidth = 10, squareDistance = 5;
      var patternCanvas = fabric.document.createElement('canvas');
      var rect = new fabric.Rect({
        width: squareWidth,
        height: squareWidth,
        angle: 45,
        fill: this.color
      });

      var canvasWidth = rect.getBoundingRectWidth();

      patternCanvas.width = patternCanvas.height = canvasWidth + squareDistance;
      rect.set({ left: canvasWidth / 2, top: canvasWidth / 2 });

      var ctx = patternCanvas.getContext('2d');
      rect.render(ctx);

      return patternCanvas;
    };

    var img = new Image();
    img.src = '../images/testPattern.png';

    var texturePatternBrush = new fabric.PatternBrush(canvas);
    texturePatternBrush.source = img;
  }

  $('drawing-mode-selector').onchange = function() {

    if (this.value === 'hline') {
      canvas.freeDrawingBrush = vLinePatternBrush;
    }
    else if (this.value === 'vline') {
      canvas.freeDrawingBrush = hLinePatternBrush;
    }
    else if (this.value === 'square') {
      canvas.freeDrawingBrush = squarePatternBrush;
    }
    else if (this.value === 'diamond') {
      canvas.freeDrawingBrush = diamondPatternBrush;
    }
    else if (this.value === 'texture') {
      canvas.freeDrawingBrush = texturePatternBrush;
    }
    else {
      canvas.freeDrawingBrush = new fabric[this.value + 'Brush'](canvas);
    }

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = drawingColorEl.value;
      canvas.freeDrawingBrush.width = parseInt(drawingLineWidthEl.value, 10) || 1;
      canvas.freeDrawingBrush.shadowBlur = parseInt(drawingShadowWidth.value, 10) || 0;
    }
  };

  drawingColorEl.onchange = function() {
    canvas.freeDrawingBrush.color = this.value;
  };
  drawingShadowColorEl.onchange = function() {
    canvas.freeDrawingBrush.shadowColor = this.value;
  };
  drawingLineWidthEl.onchange = function() {
    canvas.freeDrawingBrush.width = parseInt(this.value, 10) || 1;
    this.previousSibling.innerHTML = this.value;
  };
  drawingShadowWidth.onchange = function() {
    canvas.freeDrawingBrush.shadowBlur = parseInt(this.value, 10) || 0;
    this.previousSibling.innerHTML = this.value;
  };
  drawingShadowOffset.onchange = function() {
    canvas.freeDrawingBrush.shadowOffsetX =
    canvas.freeDrawingBrush.shadowOffsetY = parseInt(this.value, 10) || 0;
    this.previousSibling.innerHTML = this.value;
  };

  if (canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush.color = drawingColorEl.value;
    canvas.freeDrawingBrush.width = parseInt(drawingLineWidthEl.value, 10) || 1;
    canvas.freeDrawingBrush.shadowBlur = 0;
  }
})();

function initEdit(){
	// Add edit-mode functionalities
	canvas.on({
		'object:modified': checkOOB,
		'object:selected': objSelected,
		'object:scaling': setLimit,
		'object:rotating': setLimit,
		'selection:cleared': resetInfoWin,
		'object:added' : setLastObjUnselectable,
	});
	// $(document).on('keydown', function(e){	// Ctrl+S functionality
	// 	if(e.ctrlKey && e.which === 83){	// Check for the Ctrl key being pressed, and if the key = [S] (83)
	// 		saveCanvas(true);
	// 		e.preventDefault();
	// 	}
	// });
	// window.onbeforeunload = function(e){	// Page-leave functionality
	// 	if(!isSaved)
	// 		saveCanvas(false);
	// 	timedOut(false);
	// };
	$(document).on('keydown', function(e){	// Ctrl+S functionality
		if(e.ctrlKey && e.which === 90){	// Check for Ctrl and Z
			undo();
			e.preventDefault();
		}
	});
}
function setLastObjUnselectable() {
	// TODO: CHECK IF IT IS A TEXT/WHATEVER THAT NEEDS SELECTING
	var lastIndex = canvas._objects.length - 1;
	var lastItem = canvas._objects[lastIndex];
	lastItem.selectable = false;
}

// TEST: TO SHIFT LATER
function undo() {
	var lastIndex = canvas._objects.length - 1;
	if (lastIndex>=0) {
		var lastItem = canvas._objects[lastIndex];
		canvas.remove(lastItem);
	}
}

function promptBoardEmpty() {
	var data = jQuery.parseJSON(lastSave);
	if(data.objects == ""){
		var input = document.getElementById("newblkcol");
		alert("It appears your board is empty.\nPerhaps you would like to start by adding a block?");
		input.focus();
	}
}
function initColPickers(){
	// Initialise Colour Pickers
	// For the time being repetitive because i can't get the loop counter [i] into the onchange function
	var bgColor = '#123456';
	$('#canvasBGCol').colpick({
		colorScheme:'dark',
		layout:'hex',
		submit:0,
		color: bgColor,
		onChange:function(hsb,hex,rgb,el,bySetColor) {
			$(el).css('background-color','#'+hex);
			if(!bySetColor){
				canvas.backgroundColor='#'+hex;
				canvas.renderAll();
				isSaved=false;
			}
		}
	}).css('background-color', bgColor);
	$('#backgroundColor').colpick({
		colorScheme:'dark',
		layout:'hex',
		submit:0,
		onChange:function(hsb,hex,rgb,el,bySetColor) {
			$(el).css('background-color','#'+hex);
			if(!bySetColor){
				setActiveProp("backgroundColor", '#'+hex);
			}
		}
	});
	$('#textBackgroundColor').colpick({
		colorScheme:'dark',
		layout:'hex',
		submit:0,
		onChange:function(hsb,hex,rgb,el,bySetColor) {
			$(el).css('background-color','#'+hex);
			if(!bySetColor){
				setActiveStyle("textBackgroundColor", '#'+hex);
			}
		}
	});
	$('#btntextColor').colpick({
		colorScheme:'dark',
		layout:'hex',
		submit:0,
		onChange:function(hsb,hex,rgb,el,bySetColor) {
			$('#textColor').css('background-color','#'+hex);
			if(!bySetColor){
				setActiveStyle("fill", '#'+hex);
			}
		}
	});
	$('#stroke').colpick({
		colorScheme:'dark',
		layout:'hex',
		submit:0,
		onChange:function(hsb,hex,rgb,el,bySetColor) {
			$(el).css('background-color','#'+hex);
			if(!bySetColor){
				setActiveStyle("stroke", '#'+hex);
			}
		}
	});
	$('#fillColor').colpick({
		colorScheme:'dark',
		layout:'hex',
		submit:0,
		onChange:function(hsb,hex,rgb,el,bySetColor) {
			$(el).css('background-color','#'+hex);
			if(!bySetColor){
				setActiveStyle("fill", '#'+hex);
			}
		}
	});
	$('#newtextcolor').colpick({
		colorScheme:'dark',
		layout:'hex',
		submit:0,
		color: '000000',
		onChange:function(hsb,hex,rgb,el,bySetColor) {
			$(el).css('background-color','#'+hex);
			fntcolor = '#'+hex;
		}
	}).css('background-color', '#000000');
	$('#newblkcol').colpick({
		colorScheme:'dark',
		layout:'hex',
		submit:0,
		color: 'ffffff',
		onChange:function(hsb,hex,rgb,el,bySetColor) {
			$(el).css('background-color','#'+hex);
			blkcolor = '#'+hex;
		}
	}).css('background-color', '#ffffff');
}






/************************ BOARD EDITOR CONTROLLERS *************************/
function startIdleListener(){
	// Increase idle time every minute
	idleInterval = setInterval(timerIncrement, 60000);
	// Zero the idle timer on mouse or keyboard movement
	$(this).mousemove(function (e) {
		idleTime = 0;
	});
	$(this).keypress(function (e) {
		idleTime = 0;
	});
}
function timerIncrement() {
	if(++idleTime > 14) // 15 minutes
		timedOut(true);
}
function timedOut(afk) {

}






/************************ BOARD FUNCTIONS *************************/
function loadCanvas(){
	// canvas.loadFromJSON(
	// 	lastSave,							// Input data: load from lastSave
	// 	canvas.renderAll.bind(canvas),		// 'Callback'(optional): rerender canvas
	// 	function(o,object){ 				// 'Reviver' (optional): re-set default settings on all objects
	// 	setDefSettings(object);
	// }
	// );
	// isSaved = true;
}
function saveCanvas(wAlert){
	// $.ajax({
	// 	url: 'saveBoard',
	// 	data: {
	// 		boardUser: "{{ currBoard.boardUser }}",
	// 		boardID: {{ currBoard.boardID }},
	// 		data: JSON.stringify(canvas)
	// 	},
	// 	type: "POST",
	// 	async: false
	// });
	// lastSave = JSON.stringify(canvas);
	// if(wAlert)
	// 	alert("Successfully saved!");
	// isSaved = true;
}
function revert(){
	var resp=confirm("You sure? All your unsaved work will be lost...");
	if(resp==true){
		loadCanvas();
		orig=null;
	}
}
function clearCanvas(){
	var resp=confirm("Are you sure? This will clear everything!");
	if (resp){
		canvas.clear();
		isSaved = false;
	}
}






/************************ NEW OBJECTS FUNCTIONS *************************/
function setDefSettings(curr){	// *** consider adding these features to toJSON(options)
	curr.set({
		borderColor: 'rgba(67,46,79,0.75)',
		cornerColor: 'rgba(58,174,175,0.85)',
		cornerSize: 9,
		transparentCorners: false,
		originX: "center",
		originY: "center",
	});
	if(curr.height>curr.width)
		curr.set({minScaleLimit: 10.0/curr.height});
	else
		curr.set({minScaleLimit: 10.0/curr.width});
}
function addBlock(){
	var rect = new fabric.Rect({
		width: 10,
		height: 10,
		scaleX: 3,
		scaleY: 3,
		fill: blkcolor,
	});
	setDefSettings(rect);		// Consider add(rect) to do setDef, .add(), center()/setCoords, setActive, isSaved
	canvas.add(rect);
	rect.center();
	rect.setCoords();
	canvas.setActiveObject(rect);
	isSaved = false;
}
function addText() {
	var input = document.getElementById("newtext");
	var text = input.value;
	if(text == null || text.trim() == ""){
		text = "Click to edit";
	}
	var newText = new fabric.IText(text);
	newText.set({fill: fntcolor});

	canvas.add(newText);
	setDefSettings(newText);
	newText.center();
	newText.setCoords();

	canvas.setActiveObject(newText);
	isSaved = false;
}
function addPostIt(){
	var bgcolor = blkcolor;
	var txtcolor = fntcolor;
	var input = document.getElementById("newtext");
	var text = input.value;
	if(text == null || text.trim() == ""){
		text = "Click to edit";
	}
	var newText = new fabric.IText(text);
	newText.fontSize = 30;
	newText.backgroundColor = bgcolor;
	newText.fill = txtcolor;
	newText.paddingX = 10;
	newText.paddingY = 20;
	newText.scaleX = 0.6;
	newText.scaleY = 0.6;
	newText.lockUniScaling = true;
	newText.postit = true;
	newText.darkerShade = tinycolor.darken(bgcolor, 30).toHexString();
	canvas.add(newText);
	setDefSettings(newText);
	newText.center();
	newText.setCoords();
	canvas.setActiveObject(newText);
	isSaved = false;
}
	// IMAGE FUNCTIONS
	function imageBox(e) {
		$("#imagebox").overlay().load();
	}
	function preloadImage() {
		var url = document.getElementById("imageurl").value;
		var image = document.getElementById("imageHolder");
	// image.crossOrigin = 'anonymous';
	image.src = url;
	$("#noPreview").hide();
	$("#imageHolder").show();
	$("img").error(function(){
		$(this).hide();
		$("#noPreview").show();
	});
}
function addImage(){
	var url = document.getElementById("imageHolder").src;
	fabric.Image.fromURL(url, function(oImg){
		if(oImg.getHeight()>oImg.getWidth()){
			oImg.scale((canvas.getHeight()/oImg.getHeight())/2);
		}else{
			oImg.scale((canvas.getWidth()/oImg.getWidth())/2);
		}
		setDefSettings(oImg);
		canvas.add(oImg);
		oImg.center();
		oImg.setCoords();
		canvas.setActiveObject(oImg);
	}, {crossOrigin: 'anonymous'});
	$("#imagebox").overlay().close();
}

function clearHighlight() {
	var obj = canvas.getActiveObject();
	setActiveStyle("textBackgroundColor", 'clear');
}






/************************ OBJECT MODIFIERS *************************/
function cloneActive(){
	var curr = canvas.getActiveGroup() || canvas.getActiveObject();
	var items = curr._objects;
		// If curr contains multiple objects
		if(items) {
			var newItems = [];
			curr.forEachObject( function(o) {
				newItems.push(o.clone());
			});
			var clone = new fabric.Group(newItems);
			canvas.add(clone);
			setDefSettings(clone);
			clone.center();
			clone.setCoords();
			canvas.discardActiveObject();
			canvas.discardActiveGroup();
			canvas.setActiveObject(clone);
		}
		//  If curr is a single object
		else if(curr) {
			var clone = fabric.util.object.clone(curr);
			canvas.add(clone);
			clone.center();
			clone.setCoords();
			canvas.discardActiveObject();
			canvas.setActiveObject(clone);
		}
		// If no relevant object selected (remove this if isSaved is removed)
		else {
			return;
		}
		console.log(canvas);
		isSaved = false;
	}
	function delActive() {
		var currGrp = canvas.getActiveGroup();
		var curr = canvas.getActiveObject();
		if(currGrp){
			currGrp.forEachObject(function(o){ canvas.remove(o) });
			canvas.discardActiveGroup().renderAll();
		} else if(curr){
			canvas.remove(canvas.getActiveObject());
		}
		resetInfoWin();
		isSaved = false;
	}
	function groupActive() {
		var currGrp = canvas.getActiveGroup();
		if(!currGrp) return;
		// Does not support group-ception
		var items = currGrp._objects;
		for(var i = 0; i < items.length; i++) {
			if(items[i]._objects!=null){
				alert("Sorry, but we can't do group-ception! \n(i.e. no groups within groups allowed)");
				return;
			}
		}
		// Save current location
		var coords = {
			left: currGrp.left,
			top: currGrp.top,
			angle: currGrp.angle,
		};
		console.log(canvas);
		// Save items to add/remove in two arrays
		var grpItems = [];		// Clones of items
		var toRemove = [];		// Actual items
		// Find and save items in order of layer position
		// (Largest index = top object in canvas | Currently an n*m algo; I don't see a workaround.)
		for(var i=0; i<canvas._objects.length; i++){
			var temp = canvas.item(i);
			console.log(temp);
			if(currGrp.contains(temp)){
				console.log(fabric.util.object.clone(temp));
				grpItems.push(fabric.util.object.clone(temp));		// Last object in grpItems is top item
				console.log(grpItems);
				toRemove.push(temp);				// Save the items to remove (no concurrent removal)
			}
		}
		// Remove current items
		for(var i=0; i<toRemove.length;i++){
			canvas.remove(toRemove[i]);
		}
		canvas.discardActiveGroup();
	// Add group onto canvas
	console.log(grpItems);
	var newGrp = new fabric.Group(grpItems);
	canvas.add(newGrp);
	setDefSettings(newGrp);
	newGrp.set(coords);
	newGrp.setCoords();
	canvas.setActiveObject(newGrp);
	isSaved = false;

	console.log(newGrp);
}
function breakActiveGrp() {
	var curr = canvas.getActiveObject();
	if(!curr || curr._objects==null) return;
	var items = curr._objects;
	curr._restoreObjectsState();
	canvas.remove(curr);
	for(var i = 0; i < items.length; i++) {
		canvas.add(items[i]);
		setDefSettings(items[i]);
		items[i].setCoords();
	}
	canvas.discardActiveObject();
	isSaved = false;
}
// TEXT FUNCTIONS
function textFont(){
	var curr = canvas.getActiveObject();
	if(!curr) return;
	var txt = document.getElementById("infoFont").value;
}
function setActiveStyle(styleName, value, object) {
	object = object || canvas.getActiveObject();
	if (!object) return;

	if (object.setSelectionStyles || value == "clear") {
		if (value == "clear")
			value = '';
		if (!object.isEditing)
			object.selectAll();
		var style = { };
		style[styleName] = value;
		if (styleName == "strokeWidth") {
			if (value == 0)
				style["stroke"] = null;
			else if (style["stroke"] == null)
				style["stroke"] = "#FFFFFF";
		}
		object.setSelectionStyles(style);
		object.setCoords();
	} else {
		object[styleName] = value;
		if (styleName == "strokeWidth") {
			if (value == 0)
				object["stroke"] = null;
			else if (object["stroke"] == null)
				object["stroke"] = "#FFFFFF";
		}
	}

	object.setCoords();
	canvas.renderAll();
}
function setActiveProp(name, value) {
	var object = canvas.getActiveObject();
	if (!object) return;

	if (name == "backgroundColor") {
		setActiveProp("darkerShade", tinycolor.darken(value, 20).toHexString());
	}
	object.set(name, value).setCoords();
	canvas.renderAll();
}
function getActiveStyle(styleName, object) {
	object = object || canvas.getActiveObject();
	if (!object) return '';
	if (!object.isEditing)
		object.selectAll();
	return (object.getSelectionStyles && object.isEditing)
	? (object.getSelectionStyles()[styleName] || '')
	: (object.getSelectionStyles()[styleName] || '');
}
function isBold() {
	return getActiveStyle('fontWeight').indexOf('bold') > -1;
}
function toggleBold() {
	var value = isBold()
	? getActiveStyle('fontWeight').replace('bold', '')
	: (getActiveStyle('fontWeight') + ' bold');

	setActiveStyle('fontWeight', value);
}
function isItalic() {
	return getActiveStyle('fontStyle').indexOf('italic') > -1;
}
function toggleItalic() {
	var value = isItalic()
	? getActiveStyle('fontStyle').replace('italic', '')
	: (getActiveStyle('fontStyle') + ' italic');

	setActiveStyle('fontStyle', value);
}
function isUnderline() {
	return getActiveStyle('textDecoration').indexOf('underline') > -1;
}
function toggleUnderline() {
	var value = isUnderline()
	? getActiveStyle('textDecoration').replace('underline', '')
	: (getActiveStyle('textDecoration') + ' underline');

	setActiveStyle('textDecoration', value);
}
function isLinethrough() {
	return getActiveStyle('textDecoration').indexOf('line-through') > -1;
}
function toggleLinethrough() {
	var value = isLinethrough()
	? getActiveStyle('textDecoration').replace('line-through', '')
	: (getActiveStyle('textDecoration') + ' line-through');

	setActiveStyle('textDecoration', value);
}
function isOverline() {
	return getActiveStyle('textDecoration').indexOf('overline') > -1;
}
function toggleOverline() {
	var value = isOverline()
	? getActiveStyle('textDecoration').replace('overline', '')
	: (getActiveStyle('textDecoration') + ' overline');

	setActiveStyle('textDecoration', value);
}






/************************ TAB-RELATED *************************/
function switchTab(){
	$("#myTab > .active").removeClass("active");
	$("#myTabContent > .active").removeClass("active");
	$("#currObjTab").addClass("active");
	$("#modifycurrent").addClass("in active");
}
function updateInfoWin(curr){
	// Change fields for infowin
	var activeObj = canvas.getActiveObject();
	if(activeObj){
		if(activeObj.type=='i-text'){
			activeObj.lockUniScaling = true;
			document.getElementById("fontSize").value = activeObj.fontSize;
			document.getElementById("strokeWidth").value = activeObj.strokeWidth;
			document.getElementById("itext-controls").style.display = "block";
			if(activeObj.getStroke()) $('#stroke').colpickSetColor(activeObj.getStroke(), true);
			else $('#stroke').colpickSetColor('#ffffff', true)
		}else{
			document.getElementById("itext-controls").style.display = "none";
			$('#fillColor').colpickSetColor(activeObj.getFill(),true);
		}
	}
}
function toTwoDP(num){
	return Math.round(num*100)/100;
}
function resetInfoWin(){
	// Deselect effects
	atLimit=null;
	orig=null;
	document.getElementById("itext-controls").style.display = "none";
}
function updateFromWin(box){
	var curr = canvas.getActiveObject();
	if(!curr) return;
	var boxVal = parseInt(box.value);
	if(boxVal!=0 && !boxVal) return;
	switch(box.id){
		case "infoX":
		curr.set({left: boxVal});
		break;
		case "infoY":
		curr.set({top: boxVal});
		break;
		case "infoW":
		curr.set({scaleX: boxVal/curr.width});
		break;
		case "infoH":
			curr.set({scaleY: boxVal/curr.height});		// if(Math.abs(boxVal)<=800)
			break;
			case "infoAng":
			curr.set({angle: boxVal%360});
			break;
		}
		curr.setCoords();
	// Check if OOB:
	// (1) checkPos will push obj back in
	// (2) checkScaleAngle will reset obj if still OOB
	if(checkPos(curr) && checkScaleAngle(curr))
		alert("That's an invalid value!\nPlease try again.");

	// After all changes are done
	canvas.renderAll();
	atLimit = {
		top: curr.getTop(),
		left: curr.getLeft(),
		scaleX: curr.getScaleX(),
		scaleY: curr.getScaleY(),
		angle: curr.getAngle(),
	};
	orig = fabric.util.object.clone(curr);
	isSaved = false;
}





/************************ BOARD BOUNDARIES *************************/
// Save original state for clone (on selection)
// Triggers switchTab(), updates InfoWindow
function objSelected(e) {
	orig = fabric.util.object.clone(e.target);
	atLimit = {
		top: orig.getTop(),
		left: orig.getLeft(),
		scaleX: orig.getScaleX(),
		scaleY: orig.getScaleY(),
		angle: orig.getAngle(),
	};
	switchTab();
	updateInfoWin(orig);
}

	// Save last acceptable state (on scale/rotate)
	function setLimit(e){
		var curr=e.target;
		curr.setCoords();
	// if not out of bounds, save state
	// (the interval is not very fast, so this method is not so precise if you move fast)
	if(!isOOB(curr)){
		atLimit = {
			top: curr.getTop(),
			left: curr.getLeft(),
			scaleX: curr.getScaleX(),
			scaleY: curr.getScaleY(),
			angle: curr.getAngle(),
		};
	}
}
// Check if out of bounds (on modified)
function checkOOB(e){
	var curr = e.target;
	if(!curr) return;
	// if scale/angle has been modified, checkScaleAngle for OOB
	if(((orig.getScaleX() != curr.getScaleX()) || (orig.getScaleY() != curr.getScaleY())) || (orig.getAngle() != curr.getAngle()))
		checkScaleAngle(curr);
	// otherwise check position
	else
		checkPos(curr);
	// save new state
	orig = fabric.util.object.clone(curr);
	atLimit = {
		top: curr.getTop(),
		left: curr.getLeft(),
		scaleX: curr.getScaleX(),
		scaleY: curr.getScaleY(),
		angle: curr.getAngle(),
	};
	// console.log("After checkOOB: " + JSON.stringify(atLimit));
	updateInfoWin(orig);
	setDefSettings(curr);
	curr.setCoords();
	isSaved = false;
}
// Returns object holding whether curr is OOB in the four canvas edges
function getOOBObj(curr){
	var bounds = curr.getBoundingRect(),
	maxWidth = canvas.getWidth(),
	maxHeight = canvas.getHeight();
	// Additional 1px accounts for bounding rect.
	// Without this checkPos will always trigger, even after correction
	var outOf = {
		top: bounds.top < -1,
		left: bounds.left < -1,
		bottom: bounds.top+bounds.height > maxHeight+1,
		right: bounds.left+bounds.width > maxWidth+1,
	};
	return outOf;
}
// Returns boolean true if object is out of bounds in any edge(s)
function isOOB(curr){
	var outOf = getOOBObj(curr);
	return (outOf.right || outOf.left) || (outOf.bottom || outOf.top);
}
// If object is out of bounds reset to last atLimit state
function checkScaleAngle(curr){
	// console.log("InsideCheckAngle: " + JSON.stringify(atLimit));
	if(isOOB(curr)){
		curr.set(atLimit);
		curr.setCoords();
		return true;
		// console.log("New curr: " + JSON.stringify(curr));
	}
	return false;
}
// If object is out of bounds push it back in (requires object originX/Y to be "center")
function checkPos(curr){
	var updateCoords = false,
	bounds = curr.getBoundingRect(),
	maxWidth = canvas.getWidth(),
	maxHeight = canvas.getHeight();
	var outOf = getOOBObj(curr);

	if(outOf.right){
		updateCoords = true;
		curr.set({left: maxWidth-bounds.width/2});
	}
	if(outOf.bottom){
		updateCoords = true;
		curr.set({top: maxHeight-bounds.height/2});
	}
	if(outOf.left){
		updateCoords = true;
		curr.set({left: bounds.width/2});
	}
	if(outOf.top){
		updateCoords = true;
		curr.set({top: bounds.height/2});
	}

	// Implement new coordinates
	if(updateCoords){
		curr.setCoords();
		return true;
	}
	return false;
}
