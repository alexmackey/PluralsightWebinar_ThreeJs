//vehicle controls from http://chandlerprall.github.io/Physijs/examples/vehicle.html

'use strict';
	
Physijs.scripts.worker = './js/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';
	
var initScene, 
	render,
	ground_material, 
	box_material,
	projector, renderer, 
	scene, 
	ground, 
	light, 
	camera,
	vehicle_body, 
	vehicle,
	time=60,
	formattedTime,
	input;	

	function initScene() {

		projector = new THREE.Projector;
		renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);	
		
		document.getElementById('viewport').appendChild( renderer.domElement );
				
		scene = new Physijs.Scene;
		scene.setGravity(new THREE.Vector3( 0, -30, 0 ));

		camera = new THREE.PerspectiveCamera(
			35,
			window.innerWidth / window.innerHeight,
			1,
			1000
		);
		scene.add( camera );		
		
		light = new THREE.DirectionalLight( 0xFFFFFF );
		light.position.set( 20, 20, -15 );
		light.target.position.copy( scene.position );
		
		scene.add( light );

		ground_material = Physijs.createMaterial(
			new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/road.jpg' ) }),
			.8, // high friction
			.4 // low restitution
		);

		ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
		ground_material.map.repeat.set( 1, 1 );	

		var ground_geometry = new THREE.PlaneGeometry( 600, 75);
		
		ground_geometry.computeFaceNormals();
		ground_geometry.computeVertexNormals();

		ground = new Physijs.HeightfieldMesh(
				ground_geometry,
				ground_material,
				0 // mass
		);

		ground.rotation.x = -Math.PI / 2;
		scene.add(ground);

		scene.addEventListener(
			'update',
			updateCarPos				
		);
				
		function updateCarPos() {
			if ( input && vehicle ) {
					if ( input.direction !== null ) {
						input.steering += input.direction / 50;
						if ( input.steering < -.6 ) input.steering = -.6;
						if ( input.steering > .6 ) input.steering = .6;
					}
					vehicle.setSteering( input.steering, 0 );
					vehicle.setSteering( input.steering, 1 );

					if (input.power === true ) {
						vehicle.applyEngineForce(600);
					} else if ( input.power === false ) {
						vehicle.setBrake( 40, 2 );
						vehicle.setBrake( 40, 3 );
					} else {
						vehicle.applyEngineForce( 0 );
					}
				}

				scene.simulate( undefined, 2 );
		}			

		function handlePlayerDeath(){
			alert('You are dead!');
			location.reload();
		}	

		function setupTimer(){

			function updateTimer(){
				time-=0.1;

				formattedTime= Math.round(time * 10 ) / 10;
				document.getElementById("timer").innerHTML=formattedTime;

				if(time===0){
					document.getElementById("timer").innerHTML="0.0";
					handlePlayerDeath();
				}
				else{
					setTimeout(updateTimer,100);
				}
			}

			setTimeout(updateTimer,100);
		}

		function createJump(){

			var jumpStand = new Physijs.BoxMesh(
				new THREE.BoxGeometry(0.5, 3, 45),
				new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/wood.jpg' ) })
			);

			jumpStand.position.x=208;
			jumpStand.position.y=3;
			jumpStand.position.z=0;

			scene.add(jumpStand);

			var jump = new Physijs.BoxMesh(
				new THREE.BoxGeometry(25, 0.1, 45),
				new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/wood.jpg' ) })
			);

			jump.position.x=199;
			jump.position.y=5;
			jump.position.z=0;

			scene.add(jump);
		}

		

		function createObstacle(position){

			var obstacle = new Physijs.BoxMesh(
				new THREE.BoxGeometry( 5, 12, 5),
				new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/rocks.jpg' ) })
			);

			obstacle.position.set(position.x, position.y, position.z);

			scene.add(obstacle);

			obstacle.addEventListener( 'collision', function( other_object, relative_velocity, relative_rotation, contact_normal ) {
				if(other_object.name==='player'){
				   //handlePlayerDeath();
				}				   
			});

		}

		function createFinishLine(){

			
			var finishLine = new THREE.Mesh(new THREE.BoxGeometry(5, 15, 75), 
				new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 }));		
		
			finishLine.position.x = 255;
			finishLine.position.y = 9;
			scene.add(finishLine);

			var realEnd = new Physijs.BoxMesh(
				new THREE.BoxGeometry(5, 5, 50),
				new THREE.MeshBasicMaterial( { color: 0xff0000, transparent: true, opacity: 0 } )
			);

			realEnd.position.x = 275;
			realEnd.position.y = 3;
			scene.add(realEnd);

			realEnd.addEventListener( 'collision', function( other_object, relative_velocity, relative_rotation, contact_normal ) {
				
				if(other_object.name==='player'){
				   alert('You win');
				   location.reload();
				}

			});
		}		

		function createPlayer(){

			var loader = new THREE.JSONLoader();

			loader.load( "models/mustang.js", function( car, car_materials ) {
			loader.load( "models/mustang_wheel.js", function( wheel, wheel_materials ) {
				
				var mesh = new Physijs.BoxMesh(
					car,
					new THREE.MeshFaceMaterial( car_materials )
				);
				mesh.position.y = 2;
				mesh.name='player';
				
				vehicle = new Physijs.Vehicle(mesh, new Physijs.VehicleTuning(
					10.88,
					4.83,
					0.88,
					500,
					10.5,
					6000
				));
				
				mesh.rotation.y = (Math.PI / 2)

				scene.add(vehicle);

				var wheel_material = new THREE.MeshFaceMaterial( wheel_materials );

				for ( var i = 0; i < 4; i++ ) {
					vehicle.addWheel(
						wheel,
						wheel_material,
						new THREE.Vector3(
								i % 2 === 0 ? -1.6 : 1.6,
								-1,
								i < 2 ? 3.3 : -3.2
						),
						new THREE.Vector3( 0, -1, 0 ),
						new THREE.Vector3( -1, 0, 0 ),
						0.5,
						0.7,
						i < 2 ? false : true
					);
				}
				});
		});
		}

		function loadObjects(){

			createPlayer();
			createJump();

			createObstacle({x:20,y:6,z:0});
			createObstacle({x:50,y:6,z:20});
			createObstacle({x:10,y:6,z:17});
			createObstacle({x:10,y:6,z:-10});
			createObstacle({x:5,y:6,z:-20});
			createObstacle({x:60,y:6,z:-20});
			createObstacle({x:70,y:6,z: 0});
			createObstacle({x:90,y:6,z: -10});

			createFinishLine();
		}

		function configureInput(){
		
				input = {
					power: null,
					direction: null,
					steering: 0
				};
				document.addEventListener('keydown', function( ev ) {
					switch ( ev.keyCode ) {
						case 37: // left
							input.direction = 1;
							break;

						case 38: // forward
							input.power = true;
							break;

						case 39: // right
							input.direction = -1;
							break;

						case 40: // back
							input.power = false;
							break;
					}
				});
				document.addEventListener('keyup', function( ev ) {
					switch ( ev.keyCode ) {
						case 37: // left
							input.direction = null;
							break;

						case 38: // forward
							input.power = null;
							break;

						case 39: // right
							input.direction = null;
							break;

						case 40: // back
							input.power = null;
							break;
					}
				});
		}

		loadObjects();
		configureInput();
		setupTimer();

		requestAnimationFrame(render);
		scene.simulate();
	};
	
	function render() {

		requestAnimationFrame(render);

		if (vehicle) {
			camera.position.copy( vehicle.mesh.position ).add( new THREE.Vector3( 40, 25, 40 ) );
			camera.lookAt( vehicle.mesh.position );
		}

		renderer.render(scene, camera);
	};

	window.onload = initScene;