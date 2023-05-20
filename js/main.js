import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ShadowMapViewer } from 'three/examples/jsm/utils/ShadowMapViewer';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
// import  iro  from '@jaames/iro';

let camera, scene, renderer, clock;
let dirLight, spotLight;
let model, mixer;
let dirLightShadowMapViewer, spotLightShadowMapViewer;
let isSpotlightRotating = false;

// for rotations
const rotationAxis = new THREE.Vector3(0, 1, 0);
const rotationSpeed = 0.01;
let rotationAngle;
const rotationAxisCrazy = new THREE.Vector3(0.5, 1, 0.5);
const rotationSpeedCrazy = 0.01;
let rotationAngleCrazy;

// for GUI
const api = { 
	speed: '1x',
	isSpotlightRotating: false,
	changeSpotlightColor: 'white'
};
const spotLightColors = [ '#333333', '#330000', '#000033', '#003300', '#333300' ]
const colorNames = [ 'white', 'red', 'blue', 'green', 'yellow' ]



init();
animate();



function init() {

	initScene();
	initShadowMapViewers();
	initOther();

	document.body.appendChild( renderer.domElement );
	window.addEventListener( 'resize', onWindowResize );

}



function initScene() {

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.set( 50, 60, 130 );

	scene = new THREE.Scene();


	// Initial background texture
	const bgLoader = new THREE.TextureLoader();
	bgLoader.load('backgrounds/bg_1.png' , function( texture ){
			scene.background = texture; 
	});


	// Change background texture
	var bgButtons = document.querySelectorAll( '.bg-container-modal button' );
	let colorIndicator = document.getElementById( 'color-indicator' );
	const colorPicker = new iro.ColorPicker("#color-picker", { width: 80, color: "#fff" });
	colorPicker.on('color:change', function( color ) {
		colorIndicator.style.backgroundColor = color.hexString;
		scene.background = new THREE.Color( colorIndicator.style.backgroundColor );
	});

	bgButtons.forEach(function( button ) {
		button.addEventListener('click', function() {
			var bgId = button.getAttribute( 'id' );
			bgLoader.load('backgrounds/' + bgId + '.png' , function( texture ){
				scene.background = texture; 
			});
		});
	});


	// Lights
	scene.add( new THREE.AmbientLight( 0x404040 ) );

	spotLight = new THREE.SpotLight( 0x333333 );
	spotLight.angle = Math.PI / 8;
	spotLight.penumbra = 1;
	spotLight.position.set( 20, 45, 5 );
	spotLight.castShadow = true;
	spotLight.shadow.camera.near = 1;
	spotLight.shadow.camera.far = 10;
    spotLight.intensity = 155500;
    spotLight.distance = 100;
	spotLight.shadow.mapSize.width = 10000;
	spotLight.shadow.mapSize.height = 10000;
	scene.add( spotLight );

   // Helper to see how should I place my spotlight
   //scene.add( new THREE.CameraHelper( spotLight.shadow.camera ) );

	dirLight = new THREE.DirectionalLight( 0x111111, 3 );
	dirLight.position.set( 0, 7, 0 );
	//dirLight.castShadow = true;
	dirLight.shadow.camera.near = -10;
	dirLight.shadow.camera.far = 7;
	dirLight.shadow.camera.right = -45;
	dirLight.shadow.camera.left = 45;
	dirLight.shadow.camera.top	= 45;
	dirLight.shadow.camera.bottom = - 45;
	dirLight.shadow.mapSize.width = 1024;
	dirLight.shadow.mapSize.height = 1024;
	scene.add( dirLight );

    // Helper to see how should I place my direct light
	//scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );


	//Model
    const loader = new GLTFLoader();

    loader.load('assets/sillycat.gltf', function ( gltf ) {

    	model = gltf.scene;
        model.position.y = 0.01;
        model.position.z = 0.5;
    	model.scale.set( 0.13, 0.13, 0.13 );
        model.traverse( function( obj ){

          if ( obj.isMesh ) { obj.castShadow = true; }

        } );

        const clips = gltf.animations;
    
        mixer = new THREE.AnimationMixer( model );
        const clip = THREE.AnimationClip.findByName( clips, 'mixamo.com' );
        const action = mixer.clipAction( clip );
        action.play();
    
    	scene.add( gltf.scene );

		controlsGUI();

    }, undefined, function ( error ) {
    
    	console.error( error );
    
    } );


  	// Ground
  	let geometry = new THREE.BoxGeometry( 30, 0.1, 30 );
	let discoFloorTexture = new THREE.TextureLoader().load( 'assets/disco.png' );
	let material = new THREE.MeshStandardMaterial( { map: discoFloorTexture } );

	const ground = new THREE.Mesh( geometry, material );
	ground.scale.multiplyScalar( 3 );
	ground.receiveShadow = true;
	scene.add( ground );

}



function initShadowMapViewers() {

	dirLightShadowMapViewer = new ShadowMapViewer( dirLight );
	spotLightShadowMapViewer = new ShadowMapViewer( spotLight );
	resizeShadowMapViewers();

}



function initOther() {

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.physicallyCorrectLights = true;
	renderer.outputEncoding =  THREE.sRGBEncoding;
	renderer.shadowMap.enabled = true;
  	renderer.shadowMap.type = THREE.BasicShadowMap;
	renderer.shadowMap.type = THREE.PCFShadowMap;
	document.body.appendChild( renderer.domElement );


	// Mouse control
	const controls = new OrbitControls( camera, renderer.domElement );
	controls.target.set( 0, 2, 0 );
	controls.update();


	// Keyboard control
	rotationAngle = 0;
	rotationAngleCrazy = 0;
	document.addEventListener('keydown', (event) => {

		if ( event.code === 'ArrowRight' && event.ctrlKey ) { rotationAngle -= rotationSpeed; } 
		else if ( event.code === 'ArrowLeft' && event.ctrlKey ) { rotationAngle += rotationSpeed; } 
		else if ( event.code === 'Enter' ) { rotationAngleCrazy += rotationSpeedCrazy; } 
		else if ( event.code === 'Space' ) { rotationAngle = 0; rotationAngleCrazy = 0;}

	  });

	clock = new THREE.Clock();


	// Background music
	const listener = new THREE.AudioListener();
	camera.add( listener );
	const sound = new THREE.Audio( listener );
	const audioLoader = new THREE.AudioLoader();
	let context;
	window.onload = function(){
		context  = new AudioContext();
	}
	window.addEventListener('load', () => {
		context.resume().then(() => {
			audioLoader.load('music/go_kitty.mp3', function( buffer ) {
				sound.setBuffer( buffer );
				sound.setLoop( true );
				sound.setVolume( 1.0 );
				sound.play();
			});
		});
	});
	


    // Change background music from modal
	var songButtons = document.querySelectorAll( '.music-container-modal button' );
	let currentAudio = sound;
	var audios = {};

	songButtons.forEach(function( button ) {
		button.addEventListener('click', function() {
			currentAudio.stop();
			var songId = button.getAttribute( 'id' );
			if ( songId == 'mute' ) return;
			if ( !audios[songId] ) {
				audios[songId] = new THREE.Audio( listener );
				audioLoader.load('music/' + songId + '.mp3', function( buffer ) {
					audios[songId].setBuffer( buffer );
					audios[songId].setLoop( true );
					audios[songId].setVolume( 1.0 );
					audios[songId].play();
					currentAudio = audios[songId];
				});
			} else {
				audios[songId].play();
				currentAudio = audios[songId];
			}
		});
	});

	// Easter Egg
	var easterEgg = document.querySelectorAll( '.easter-egg button' );

	easterEgg.forEach(function( button ) {
		button.addEventListener('click', function() {
				currentAudio.stop();
				var songEasterId = button.getAttribute( 'id' );
				const soundEasterEgg = new THREE.Audio( listener );
				audioLoader.load('music/' + songEasterId + '.mp3', function( buffer ) {
					soundEasterEgg.setBuffer( buffer );
					soundEasterEgg.setLoop( true );
					soundEasterEgg.setVolume( 1.0 );
					soundEasterEgg.play();
					currentAudio = soundEasterEgg;
				});
			});
	});

}



function controlsGUI(){

	const gui = new GUI();
	const speed = [ '0.5x', '0.75x', '1x', '1.25x', '1.5x', '2x' ];

	// Change animation speed
	const speedFolder = gui.addFolder( 'Animation speed' );
	const clipCtrl = speedFolder.add( api, 'speed' ).options( speed );
	clipCtrl.onChange( onSpeedChanged );
	speedFolder.open();

	// Change position of the object on the axis
	const positionFolder = gui.addFolder( 'Model position' );
	positionFolder.add( model.position, "x", -42, 42, 1 ).name( 'X position' );
	positionFolder.add( model.position, "y", -55, 42, 1 ).name( 'Y position' );
	positionFolder.add( model.position, "z", -41, 42, 1 ).name( 'Z position' );

	// Make the spotlight move around the scene + change its color
	const spotlightFolder = gui.addFolder( 'Spotlight' )
	spotlightFolder.add( api, 'isSpotlightRotating' ) .name( 'rotate spotlight' ).onChange(function( value ) {
		isSpotlightRotating = value;
	});
	spotlightFolder.add( api, 'changeSpotlightColor' ).name( 'change spotlight color' ).options( colorNames ).onChange(function( value ){
		const index = colorNames.indexOf( value );
		spotLight.color = new THREE.Color( spotLightColors[index] );
	});



}



function onSpeedChanged( value ){

	const speed = parseFloat( value ); 

	if ( mixer ) {
		mixer.timeScale = speed;
	}

}



function resizeShadowMapViewers() {

	const size = window.innerWidth * 0.15;

	dirLightShadowMapViewer.position.x = 10;
	dirLightShadowMapViewer.position.y = 10;
	dirLightShadowMapViewer.size.width = size;
	dirLightShadowMapViewer.size.height = size;
	dirLightShadowMapViewer.update(); 

	spotLightShadowMapViewer.size.set( size, size );
	spotLightShadowMapViewer.position.set( size + 20, 10 );
  	spotLightShadowMapViewer.update();

}



function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
  	camera.updateProjectionMatrix();

  	renderer.setSize( window.innerWidth, window.innerHeight );

	resizeShadowMapViewers();
	dirLightShadowMapViewer.updateForWindowResize();
	spotLightShadowMapViewer.updateForWindowResize();

}



function animate() {

	requestAnimationFrame( animate );

	if ( mixer ) {
		mixer.update( clock.getDelta() );
	}

	if ( isSpotlightRotating ) {
		spotLight.position.applyAxisAngle( rotationAxis, rotationSpeed );
		spotLight.target.position.x = 2;
		spotLight.target.position.z = 2;
	}


	render();

}



function renderScene() {

	scene.rotateOnAxis( rotationAxis, rotationAngle );
	scene.rotateOnAxis( rotationAxisCrazy, rotationAngleCrazy );
	renderer.render( scene, camera );

}




function render() {

	const delta = clock.getDelta();
  	mixer.update( delta );
	renderScene();

}