// Referinta la elementul canvas
let canvas;

//context pt a putea folosi functii de desenare si a lucra cu canvas
let ctx;

// Stocheaza imagini desenate anterior pentru a le redesena dupa ce au fost adaugate desene noi
let savedImageData;

// variabila folosita pentru a determina daca miscam cursorul in timp ce apasam pe mouse
let dragging = false;

let strokeColor = 'black';
let fillColor = 'black';
let line_Width = 2;

let polygonSides = 6;

// Instrumentul curent folosit. Optiunea default va fi brush
let currentTool = 'brush';
let canvasWidth = 600;
let canvasHeight = 600;
 
// Variabila ce indica daca instrumentul folosit este pensula 
let usingBrush = false;
// 2 vectori care stocheaza coordonatele x si y ale punctelor pensulei
let brushXPoints = new Array();
let brushYPoints = new Array();

// vector ce va stoca daca mouseul este apasat in timp ce folosim pensula
let brushDownPos = new Array();


//clasa ce va stoca informatii pentru a crea preview de desenare pana sa eliberam mouse-ul
class PreviewBox{
    constructor(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
}
 
//Clasa ce stocheaza coordonatele x si y unde mouse-ul a fost apasat
class MouseDownPos{
    constructor(x,y) {
        this.x = x,
        this.y = y;
    }
}
 
// Clasa ce stocheaza coordonatele curente ale cursorului
class Location{
    constructor(x,y) {
        this.x = x,
        this.y = y;
    }
}
 
// Clasa ce stocheaza coordonatele punctelor poligoanelor
class PolygonPoint{
    constructor(x,y) {
        this.x = x,
        this.y = y;
    }
}

// Retine coordonatele si dimensiunea cutiei formei desenate
let previewBox = new PreviewBox(0,0,0,0);

// Tine coordonatele mouseului cand a fost apasat initial
let mousedown = new MouseDownPos(0,0);

// Tine coordonatele curente x si y ale mouseului
let loc = new Location(0,0);
 

//Se va executa functia setareCanvas la incarcarea paginii
document.addEventListener('DOMContentLoaded', setareCanvas);

 
function setareCanvas()
{//functie de setare canvas cu elemente default

    // Preia referinta a elementului canvas
    canvas = document.getElementById('my-canvas');

    // Preia metodele necesare utilizarii elem canvas
    ctx = canvas.getContext('2d');

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = line_Width;


    //evenimente ce vor apela functii cand mouse-ul este apasat, miscat sau eliberat
    canvas.addEventListener("mousedown", ReactToMouseDown);
    canvas.addEventListener("mousemove", ReactToMouseMove);
    canvas.addEventListener("mouseup", ReactToMouseUp);
}

 
function ChangeTool(toolClicked)
{//functie pentru schimbarea instrumentului folosit
    //are ca parametru un string cu instrumentul selectat
    document.getElementById("save").className = "";
    document.getElementById("brush").className = "";
    document.getElementById("line").className = "";
    document.getElementById("rectangle").className = "";
    document.getElementById("circle").className = "";
    document.getElementById("ellipse").className = "";
    document.getElementById("polygon").className = "";
    // Highlight ultimul instrument selectat in bara de unelte
    document.getElementById(toolClicked).className = "selected";
    // Schimba instrumentul curent folosit
    currentTool = toolClicked;
}

// Returneaza pozitia mouse-ului in functie de pozitia canvas-ului in pagina
function GetMousePosition(x,y){
    // Stocam pozitia si marimea canvasului in pagina
    let canvasSizeData = canvas.getBoundingClientRect();
    return { x: (x - canvasSizeData.left) * (canvas.width  / canvasSizeData.width),
        y: (y - canvasSizeData.top)  * (canvas.height / canvasSizeData.height)
      };
}
 
function SaveCanvasImage()
{
    savedImageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    let i=0;
    while(brushXPoints.length>0)
    {
        brushXPoints.pop();
        i++;
    }

    i=0;
    while(brushYPoints.length>0)
    {
        brushYPoints.pop();
        i++;
    }

    i=0;
    while(brushDownPos.length>0)
    {
        brushDownPos.pop();
        i++;
    }
}
 
function RedrawCanvasImage()
{
    // Functie ce va redesena canvasul da fiecare data cand adaugam un element nou
    ctx.putImageData(savedImageData,0,0);
}
 
function UpdatePreviewSizeData(loc)
{
    //Aflam inaltimea si latimea prin diferenta coordonatelor 
    //dintre pozitia unde a fost apasat mouseul si pozitia curenta a mouseului
    previewBox.width = Math.abs(loc.x - mousedown.x);
    previewBox.height = Math.abs(loc.y - mousedown.y);
 
    // Daca mouse-ul este mai jos decat pozitia in care a fost apasat
    // vom stoca pozitia initiala
    if(loc.x > mousedown.x){
 
        // Retinem punctul in care a fost apasat pt ca este punctul cel mai din stanga
        previewBox.left = mousedown.x;
    } else {
 
        // Retinem locatia curenta a mouseului ptca este punctul cel mai din stanga
        previewBox.left = loc.x;
    }
 
    // Acelasi procedeu, dar acum cautam punctul cel mai de sus
    if(loc.y > mousedown.y){
 
        previewBox.top = mousedown.y;
    } else {
        previewBox.top = loc.y;
    }
}
 
function radiansToDegrees(rad)
{
    if(rad < 0)
    {
        return (360.0 + (rad * (180 / Math.PI))).toFixed(2);
    } 
    else 
    {
        return (rad * (180 / Math.PI)).toFixed(2);
    }
}
 
function degreesToRadians(degrees)
{
    return degrees * (Math.PI / 180);
}

// Afla unghiul pe baza coordonatelor x si y
// x = latura alaturata unghiului
// y = latura opusa
// Tan(unghi) = opusa / alaturata
// Unghi = ArcTan(opusa / alaturata)
function getAngleUsingXAndY(mouselocX, mouselocY)
{
    let adjacent = mousedown.x - mouselocX;
    let opposite = mousedown.y - mouselocY;
 
    return radiansToDegrees(Math.atan2(opposite, adjacent));
}
 
 
function getPolygonPoints(){
    
    // Aflam unghiul in radiani in functie de locatia mouseului (x,y)
    let angle =  degreesToRadians(getAngleUsingXAndY(loc.x, loc.y));
 
    
    let radiusX = previewBox.width;
    let radiusY = previewBox.height;
    // Vector ce contine punctele poligonului
    let polygonPoints = [];
 

    for(let i = 0; i < polygonSides; i++)
    {
        polygonPoints.push(new PolygonPoint(loc.x + radiusX * Math.sin(angle),
        loc.y - radiusY * Math.cos(angle)));
 
       
        angle += 2 * Math.PI / polygonSides;
    }
    return polygonPoints;
}
 

// Se deseneaza poligonul pe baza punctelor stocate
function getPolygon(){
    let polygonPoints = getPolygonPoints();
    ctx.beginPath();
    ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for(let i = 1; i < polygonSides; i++){
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    ctx.closePath();

}
 
// Functie ce deseneaza cu preview
// in functie de instrumentul selectat
function drawPreviewShape(loc)
{
    if(currentTool === "brush"){
        
        DrawBrush();
        
    } else if(currentTool === "line"){

        ctx.strokeStyle=document.getElementById("toolColor").value;
        ctx.lineWidth=document.getElementById("toolSize").value;
        ctx.beginPath();
        ctx.moveTo(mousedown.x, mousedown.y);//pozitia in care a fost apasat
        ctx.lineTo(loc.x, loc.y);//pozitia curenta
        ctx.stroke();
    } else if(currentTool === "rectangle"){
        
        ctx.strokeStyle=document.getElementById("toolColor").value;
        ctx.lineWidth=document.getElementById("toolSize").value;
        ctx.strokeRect(previewBox.left, previewBox.top, previewBox.width, previewBox.height);
    } else if(currentTool === "circle"){
        
        let radius = previewBox.width;
        ctx.strokeStyle=document.getElementById("toolColor").value;
        ctx.lineWidth=document.getElementById("toolSize").value;
        ctx.beginPath();
        ctx.arc(mousedown.x, mousedown.y, radius, 0, Math.PI * 2);
        ctx.stroke();
    } else if(currentTool === "ellipse"){
        
        // ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle)
        ctx.strokeStyle=document.getElementById("toolColor").value;
        ctx.lineWidth=document.getElementById("toolSize").value;
        let radiusX = previewBox.width / 2;
        let radiusY = previewBox.height / 2;
        ctx.beginPath();
        ctx.ellipse(mousedown.x, mousedown.y, radiusX, radiusY, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
    } else if(currentTool === "polygon"){
        
        ctx.strokeStyle=document.getElementById("toolColor").value;
        ctx.lineWidth=document.getElementById("toolSize").value;
        polygonSides=document.getElementById("Numar").value;
        getPolygon();
        ctx.stroke();
    }
}
 
function UpdatePreviewOnMove(loc)
{
    
    UpdatePreviewSizeData(loc);
 
    drawPreviewShape(loc);
}
 

// Functie ce va retine coordonatele punctelor prin care mouse-ul se plimba cand este folosita pensula
// si daca mouse-ul este plimbat
function AddBrushPoint(x, y, mouseDown){
    brushXPoints.push(x);
    brushYPoints.push(y);
    // Retine daca mouse-ul este apasat
    brushDownPos.push(mouseDown);
}
 

// Parcurgem toate punctele pensulei si le conectam
function DrawBrush(){
    ctx.strokeStyle=document.getElementById("toolColor").value;
    ctx.lineWidth=document.getElementById("toolSize").value;
    for(let i = 1; i < brushXPoints.length; i++){
        //ctx.strokeStyle=document.getElementById("toolColor").value;
        //ctx.lineWidth=document.getElementById("toolSize").value;
        ctx.beginPath();
 

        //Verificam daca mouseul a fost apasat
        // Daca da, continuam desenul
        if(brushDownPos[i]){
            ctx.moveTo(brushXPoints[i-1], brushYPoints[i-1]);
        } else {
            ctx.moveTo(brushXPoints[i]-1, brushYPoints[i]);
        }
        ctx.lineTo(brushXPoints[i], brushYPoints[i]);
        ctx.closePath();
        ctx.stroke();
    }
}
 
function ReactToMouseDown(e){
    canvas.style.cursor = "crosshair";
    // Salvam locatia mouseului
    loc = GetMousePosition(e.clientX, e.clientY);
    
    SaveCanvasImage();
    
    // Salvam locatia mouseului cand a fost apasat
    mousedown.x = loc.x;
    mousedown.y = loc.y;
    // Spunem ca mouseul se deplaseaza
    dragging = true;
 
    // Adaugam punctele pensulei in vector
    if(currentTool === 'brush'){
        usingBrush = true;
        AddBrushPoint(loc.x, loc.y);
    }
};
 
function ReactToMouseMove(e){
    canvas.style.cursor = "crosshair";
    loc = GetMousePosition(e.clientX, e.clientY);
 
    
    // Daca folosim pensula si trasam mouseul memoram punctele
    if(currentTool === 'brush' && dragging && usingBrush){
        // Se pastreaza doar punctele din interiorul canvasului
        if(loc.x > 0 && loc.x < canvasWidth && loc.y > 0 && loc.y < canvasHeight){
            AddBrushPoint(loc.x, loc.y, true);
        }
        RedrawCanvasImage();
        DrawBrush();
    } else {
        if(dragging){
            RedrawCanvasImage();
            UpdatePreviewOnMove(loc);
        }
    }
};
 
function ReactToMouseUp(e){
    canvas.style.cursor = "default";
    loc = GetMousePosition(e.clientX, e.clientY);
    RedrawCanvasImage();
    UpdatePreviewOnMove(loc);
    dragging = false;
    usingBrush = false;
}
 

// Salveaza imaginea in directorul download
function SaveImage(){
    // Luam referinta la elementul link
    var imageFilePng = document.getElementById("img-file-png");
    var imageFileJpg=document.getElementById("img-file-jpg")
    
    imageFilePng.setAttribute('download', 'image.png');
    imageFileJpg.setAttribute('download', 'image.jpg');

    // Referinta la imaginea din canvas pentru download
    imageFilePng.setAttribute('href', canvas.toDataURL());
    imageFileJpg.setAttribute('href', canvas.toDataURL());
}
 


function ChangeBackgroundColor(color)
{
    canvas.style.backgroundColor=color;
}

/*var b=document.getElementById("Resetare");
b.addEventListener("click",ClearCanvas;*/

function ClearCanvas()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}