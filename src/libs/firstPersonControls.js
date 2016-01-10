/**
 * @author mrdoob / http://mrdoob.com/
 * @author schteppe / https://github.com/schteppe
 * @author alex2401 / https://github.com/sasha240100
 */
 const PI_2 = Math.PI / 2;
 var PointerLockControls = function ( camera, mesh, params) {

    /* Velocity properties */
    var velocityFactor = 1, //Same as 20 * 0.05
        runVelocity = 0.25;
    mesh.setAngularFactor(new THREE.Vector3(0, 0, 0));

    /* Init */
    var scope = this,
        pitchObject = new THREE.Object3D();
    pitchObject.add( camera );

    var yawObject = new THREE.Object3D();
    yawObject.position.y = params.ypos; // eyes are 2 meters above the ground
    yawObject.add( pitchObject );

    var quat = new THREE.Quaternion(),
        moveForward = false,
        moveBackward = false,
        moveLeft = false,
        moveRight = false,
        canJump = false;

    var contactNormal = new THREE.Vector3(); // Normal in the contact, pointing *out* of whatever the player touched

    mesh.addEventListener("collision", function(other_object, v, r, contactNormal){

        // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
        //Update, we do not need upAxis, (a, b, c).dot((0, 1, 0)) = b right ?
        if(contactNormal.y < 0.5) // Use a "good" threshold value between 0 and 1 here!
            canJump = true;
    });
    var lastX = 0,
        lastY = 0; //event.movementX, event.movementY is not supported in IE and probably in Androis, iOS ...
    function onMouseMove ( event ) {
        if ( scope.enabled === false ) return;
      
        var movementX = event.movementX || event.mozMovementX || e.clientX - lastX || 0,
            movementY = event.movementY || event.mozMovementY || e.clientY - lastY || 0;
        lastX = e.clientX,
        lastY = e.clientY,
        yawObject.rotation.y -= movementX * 0.002,
        pitchObject.rotation.x -= movementY * 0.002;

        pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );
    };

    function onKeyDown ( event ) {

        switch ( event.keyCode ) {

            case 38: // up
            case 87: // w
                moveForward = true;
                break;

            case 37: // left
            case 65: // a
                moveLeft = true; 
                break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                break;

            case 32: // space
                if ( canJump == true ){
                    mesh.applyCentralImpulse({x: 0, y: 300, z: 0}); //Read the PhysiJS Code, they do not verify if
                    //the argument is a THREE.Vector3 as long is it has x, y, z
                }
                canJump = false;
                break;

            case 15: // shift
                runVelocity = 0.5;
                break;
        }

    };

    function onKeyUp ( event ) {
        switch( event.keyCode ) {

            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // a
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;

            case 15: // shift
                runVelocity = 0.25;
                break;
        }

    };

    document.body.addEventListener( 'mousemove', onMouseMove, false );
    document.body.addEventListener( 'keydown', onKeyDown, false );
    document.body.addEventListener( 'keyup', onKeyUp, false );

    this.enabled = false;

    this.getObject = function () {
        return yawObject;
    };
    this.getDirection = function(targetVec){
        targetVec.set(0,0,-1);
        quat.multiplyVector3(targetVec);
    }

    // Moves the camera to the Cannon.js object position and adds velocity to the object if the run key is down
    var inputVelocity = new THREE.Vector3(),
        euler = new THREE.Euler();
    
    this.update = function ( delta ) {

        var moveVec = new THREE.Vector3();

        if ( scope.enabled === false ) return;
        //Variables are passed by value, setting delta to 0.5 is meaningless
        delta = 0.5;
        delta = Math.min(delta, 0.5);
        //console.log(delta);

        inputVelocity.set(0,0,0);

        if ( moveForward ){
            inputVelocity.z = -velocityFactor * delta * params.speed * runVelocity;
        }
        if ( moveBackward ){
            inputVelocity.z = velocityFactor * delta * params.speed * runVelocity;
        }

        if ( moveLeft ){
            inputVelocity.x = -velocityFactor * delta * params.speed * runVelocity;
        }
        if ( moveRight ){
            inputVelocity.x = velocityFactor * delta * params.speed * runVelocity;
        }

        // Convert velocity to world coordinates
        euler.x = pitchObject.rotation.x,
        euler.y = yawObject.rotation.y,
        euler.order = "XYZ",
        quat.setFromEuler(euler);
        //But threeJS does verify, look the src/Math/Quaternion.js
        inputVelocity.applyQuaternion(quat);
        //quat.multiplyVector3(inputVelocity);

        mesh.applyCentralImpulse({inputVelocity.x * 10, 0, inputVelocity.z * 10});
        mesh.setAngularVelocity({inputVelocity.z * 10, 0, -inputVelocity.x * 10});

        yawObject.position.copy(mesh.position);
    };
};
