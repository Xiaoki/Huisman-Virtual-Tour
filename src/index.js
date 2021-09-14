import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
//import { MapControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './css/style.css';
import { AxesHelper, Mesh, MeshBasicMaterial, Scene, SphereGeometry } from 'three';
import { sRGBEncoding } from 'three/build/three.module.js';

let scene, camera, cameraMain, cameraViewer, renderer, controls, viewerSphere, 
huismanModel, sceneMain, sceneViewer, controlsMain, controlsViewer;

const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();
const mouse = new THREE.Vector2();
let buttonB1A;
let buttonSkyhookTop;
const buttonsGroup = new THREE.Group();
const mainAppGroup = new THREE.Group();
const viewerSphereGroup = new THREE.Group();

init();

function init(){


    //###############################################//
    //############# Main Scene setup ################//
    //###############################################//

    // Create new scene
    sceneMain = new THREE.Scene();
    sceneMain.background = new THREE.Color(0x467ba3);
    sceneMain.fog = new THREE.Fog( 0x467ba3, 10, 300);

    // Create new camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
    camera.position.set( 50, 75, -25);

    sceneMain.add(camera);

    // Create renderer
    renderer = new THREE.WebGLRenderer(
        {
            canvas: document.querySelector('canvas.webgl'),
            antialias: true
            
        }
    );
 
    //renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setSize(window.innerWidth, window.innerHeight);

    //adjustOrbitControls(main);

    // // // Set map controls
    controls = new OrbitControls( camera, renderer.domElement );
    
    
    adjustOrbitControls('normal');
    

    // Scene lighting setup
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8)
    sceneMain.add(directionalLight);

    const ambientlight = new THREE.AmbientLight(0xffffff, 0.7);
    sceneMain.add(ambientlight);

    // ############################ Setup main app group. ################################### //

    // Load GTLF floorplan model
    const floorPlanLoader = new GLTFLoader();
    floorPlanLoader.load('./Huisman.Floor.Plan.gltf', function ( floorPlan )
        {        
            //floorPlan.scene.rotation.y = 2 * Math.PI * (250 / 360); // Convert degree to RAD.
            huismanModel = floorPlan.scene;
            huismanModel.castShadow = true;
            mainAppGroup.add(huismanModel);
        
        }

    );

    floorPlanLoader.load('./Huisman.Environment.gltf', function( environment)
        {
           // environment.scene.rotation.y = 2 * Math.PI * (250 / 360); // Convert degree to RAD.
            environment.scene.castShadow = true;
            mainAppGroup.add(environment.scene);
        }
    );

    floorPlanLoader.load('./skyhook.gltf', function(skyhook)
        {
            let skyhookModel = skyhook.scene;
            skyhookModel.scale.set(300, 300, 300)
            skyhookModel.position.set(25,0,-50)
            skyhookModel.rotateY(2 * Math.PI * (90/360));
            skyhookModel.castShadow = true;	
		    skyhookModel.children[5].material.metalness = 0.2;
            mainAppGroup.add(skyhook.scene);
        }
    );

    // Green Floor 
    const groundFloorPlaneGeometry = new THREE.PlaneGeometry(1000,1000);
    const groundFloorPlaneMaterial  = new THREE.MeshBasicMaterial({color: 0x6a9d5c});

    const groundFloorPlane = new THREE.Mesh(groundFloorPlaneGeometry, groundFloorPlaneMaterial);
    groundFloorPlane.rotation.x = -(Math.PI /2);
    groundFloorPlane.position.y = -0.5;
    groundFloorPlane.receiveShadow = true;
    sceneMain.add(groundFloorPlane);

    //const AxesHelper = new THREE.AxesHelper(50);
    //sceneMain.add(AxesHelper);
 
    // Setup the interactable geometry and material
    const buttonB1AGeometry = new THREE.SphereGeometry(1.5,15,15);
    const buttonB1AMaterial = new THREE.MeshBasicMaterial({color: 0xfff333});
    buttonB1A = new THREE.Mesh(buttonB1AGeometry, buttonB1AMaterial);
    buttonB1A.name = "B1A";
    buttonB1A.position.set(-7.5, 18, 40);

    const buttonSkyhookGeometry = new THREE.SphereGeometry(1.5,15,15);
    const buttonSkyhookMaterial = new THREE.MeshBasicMaterial({color: 0xfff333});
    buttonSkyhookTop = new THREE.Mesh(buttonSkyhookGeometry, buttonSkyhookMaterial);
    buttonSkyhookTop.name = "Skyhook";
    buttonSkyhookTop.position.set(27, 17, -50);
    

    //Add buttons to group.
    buttonsGroup.add(buttonB1A);
    buttonsGroup.add(buttonSkyhookTop);
   
    // setup main App group
    mainAppGroup.add(buttonsGroup);

    // add group to scene.
    
    sceneMain.add(mainAppGroup); // Add the mainAppGroup to scene




    //###############################################//
    //############ Second Scene Setup ###############//
    //###############################################//

    sceneViewer = new THREE.Scene();
    sceneViewer.background = new THREE.Color(0x467ba3);

    const viewerDirectionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8)
    sceneViewer.add(viewerDirectionalLight);

    const viewerAmbientlight = new THREE.AmbientLight(0xffffff, 0.7);
    sceneViewer.add(viewerAmbientlight);


    // Create texture loader
    const viewerB1aTexture = new THREE.TextureLoader().load('./img/huisman.b1a.small.jpg');

    const viewerSphereGeometry = new THREE.SphereBufferGeometry(50, 50,50 );
    const viewerSphereMaterial = new THREE.MeshBasicMaterial({map: viewerB1aTexture});
    viewerSphereMaterial.side = THREE.DoubleSide;
    viewerSphere = new THREE.Mesh(viewerSphereGeometry, viewerSphereMaterial);
    viewerSphere.scale.x = -1

    sceneViewer.add(viewerSphere);



    scene = sceneMain;

}





// Tick function, gets hit every frame.
function animate() {


    // Request next frame
	requestAnimationFrame( animate );

    // update Map controls.
    controls.update();
    mouseHover();

    renderer.render(scene, camera);
    
    
}


function mouseHover(){

    const elapsedTime = clock.getElapsedTime;
   
    // Find intersecting objects.
    raycaster.setFromCamera(mouse, camera);

    const objectsToTest = [buttonB1A, buttonSkyhookTop];
    const intersects = raycaster.intersectObjects(objectsToTest);

    if (intersects.length > 0)
        {
           for (const intersect of intersects)
           {

            //console.log(intersect);
            //    if (intersect != )
            //    console.log(intersect.object.name)
            //    intersect.object.material.color.set('#FF0000');
           } 

           for ( const x of intersects ) {}
        }
    
}


function onMouseMove (event) {
    event.preventDefault();
    mouse.x = event.clientX / window.innerWidth * 2 - 1 ;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1 ;
};

// Resize the camera on browser resize.
function onWindowResize(){
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function adjustOrbitControls(mode){

    if( mode == 'viewer'){
        controls.screenSpacePanning = true;
        controls.maxPolarAngle = 3 ; //Math.PI / 2 + -.3; // Lock rotating down.
        controls.minPolarAngle = 0 ;//Math.PI /2 + -1; // lock rotating up.
        controls.enablePan = false;
        controls.maxDistance = 100;
        controls.minDistance = 0;
        controls.rotateSpeed = 0.7;
        camera.position.set(0,0.1,0)
        controls.target.set(10,1,0)
        

        controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            RIGHT: THREE.MOUSE.ROTATE
        }
        controls.touches = {
            ONE: THREE.TOUCH.ROTATE
        }
        controls.enableZoom = false;


        controls.update();

    }else{
        controls.screenSpacePanning = false;
        controls.maxPolarAngle = 0.9 ; //Math.PI / 2 + -.3; // Lock rotating down.
        controls.minPolarAngle = 0.9 ;//Math.PI /2 + -1; // lock rotating up.
        controls.enablePan = true;

        controls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            RIGHT: THREE.TOUCH.ROTATE
        }

        controls.touches.ONE = THREE.TOUCH.PAN;
        controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
        controls.maxDistance = 100;
        controls.minDistance = 100;

        camera.position.set( 50, 75, -25);
        controls.update();
        

    }

}

function load360Sphere(id){

    console.log(id);

    if (id == 'Skyhook')
    {
        const viewerSkyhookTexture = new THREE.TextureLoader().load('./img/huisman.skyhook.small.jpg');
        viewerSphere.material.map = viewerSkyhookTexture;   
        
    } else if ( id == 'B1A')
    {
        const viewerB1aTexture = new THREE.TextureLoader().load('./img/huisman.b1a.small.jpg');
        viewerSphere.material.map = viewerB1aTexture;
    }

    scene = sceneViewer;
    adjustOrbitControls('viewer');
    document.getElementById("back").style.visibility="visible";


}

function onClick(event){

    raycaster.setFromCamera(mouse, camera);
    const selectableObjects = [buttonB1A, buttonSkyhookTop];
    const intersects = raycaster.intersectObjects(selectableObjects);

    if ( intersects.length > 0 )
    {
        load360Sphere(intersects[0].object.name);        
    }
}

// Zoom function called by zoom button in HTML
function buttonResponse(event){
    if (event.target.id == 'back')
        {

            scene = sceneMain;
            adjustOrbitControls('normal');
            document.getElementById("back").style.visibility="hidden";
        } 
    
    else if (event.target.id == 'rotateBTN') 
        {
            console.log('You are trying to rotate');

        }
    else
        { 
            console.log('Error: No action given for button response');
        }
}


// Add event listeners to all buttons. Then call buttonReponse functions for processing
document.getElementById("back").style.visibility="hidden";
let buttons = document.getElementsByTagName("button");
for (let i = 0; i < buttons.length; i++ ) {
    buttons[i].addEventListener('click', buttonResponse, false);
};

// All event listereners
window.addEventListener('resize', onWindowResize, false);
window.addEventListener('click', onClick);
document.addEventListener('mousemove', onMouseMove);




animate();