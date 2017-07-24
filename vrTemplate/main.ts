class Game {
  private _canvas: any;//HTMLCanvasElement;
  private _engine: BABYLON.Engine;
  private _scene: BABYLON.Scene;
  private _camera: BABYLON.FreeCamera;
  private _light: BABYLON.Light;

  constructor(canvasElement: string) {
    // Create canvas and engine
    this._canvas = document.getElementById(canvasElement);
    this._engine = new BABYLON.Engine(this._canvas, true);
  }

  async loadModel(root, name):Promise<BABYLON.Mesh>{
    var p:Promise<BABYLON.Mesh> = new Promise((res, rej)=>{
      var parent = new BABYLON.Scene(this._engine)
      BABYLON.SceneLoader.ImportMesh(null, root, name, this._scene, function (meshses) {
        var parent = new BABYLON.Mesh("", this._scene)
        meshses.forEach((m)=>{
          //console.log(m.parent == this._scene)
          if(m.parent == this._scene){
            console.log("hit")
            parent.addChild(m)
            //m.parent = parent
          }
        })
        res(parent);
      }, null, function (scene) {
          rej("failed to load model")
      })
      var m = new BABYLON.Mesh(null,null);
    });
    return p;
  }

  async createScene() {
    // create a basic BJS Scene object
    this._scene = new BABYLON.Scene(this._engine);
    this._scene.useRightHandedSystem = true;

    var headset = null;
    // If a VR headset is connected, get its info
    if(navigator.getVRDisplays){
      var displays = await navigator.getVRDisplays()
      if (displays[0]) {
        headset = displays[0];
        console.log(headset)
      }
      console.log("hit3")
    }

    if (headset) {
      // Create a WebVR camera with the trackPosition property set to false so that we can control movement with the gamepad
      this._camera = new BABYLON.WebVRFreeCamera("vrcamera", new BABYLON.Vector3(0, 0, -10), this._scene, { trackPosition: false });
      //this._camera.deviceScaleFactor = 1;
    } else {
      // create a FreeCamera, and set its position to (x:0, y:5, z:-10)
      this._camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 1.5, -10), this._scene);

      //  this._camera = new BABYLON.ArcRotateCamera("camera", 4.712, 1.571, 0.05, BABYLON.Vector3.Zero(), this._scene);
      //   this._camera.attachControl(this._canvas, true);
      //   this._camera.wheelPrecision = 100.0;
      //   this._camera.minZ = 0.01;
      //   this._camera.maxZ = 1000;
    }

    this._scene.onPointerDown = () => {
      console.log("down")
      this._scene.onPointerDown = undefined
      this._camera.attachControl(this._canvas, true);
    }


    // target the camera to scene origin
    this._camera.setTarget(BABYLON.Vector3.Zero());

    // attach the camera to the canvas
    this._camera.attachControl(this._canvas, false);

    // BABYLON.SceneLoader.Load("./glTF-Sample-Models/2.0/Duck/glTF-Embedded", "duck.gltf", this._engine, function (scene) { 
    //   console.log(scene)
    //   // do somethings with the scene
    // });

   

    // create a basic light, aiming 0,1,0 - meaning, to the sky
    this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this._scene);

    // create the skybox cubemap
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 10000, this._scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this._scene);
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("Textures/sky7/sky7", this._scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    // create the ground (round platform)
    var groundMaterial = new BABYLON.StandardMaterial("ground", this._scene);
    groundMaterial.diffuseTexture = new BABYLON.Texture("textures/polar_grid.png", this._scene);
    var ground = BABYLON.Mesh.CreateCylinder("ground", 0.1, 3, 3, 100, 10, this._scene);
    // the user should see the ground below
    ground.position = new BABYLON.Vector3(0, 0, -10);
    ground.material = groundMaterial;

    // // create a built-in "sphere" shape; with 16 segments and diameter of 2
    // let sphere = BABYLON.MeshBuilder.CreateSphere('sphere1',
    //   { segments: 16, diameter: 2 }, this._scene);

    // // move the sphere upward 1/2 of its height
    // sphere.position.y = 1;
    //   BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING
    
    //BABYLON.SceneLoader.ImportMesh()
    var objectCount = 5
    for(var i = 0;i<objectCount;i++){
      var meshName = Math.random() > 0.5 ? "Duck" : "Avocado"
      var parent = await this.loadModel("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/"+meshName+"/glTF/", meshName+".gltf")
      
      var size = 0
      var bottom = Infinity

      //Try to get object x size and bottom y pos
      parent.getChildMeshes().forEach((c)=>{
        var diff = c.getBoundingInfo().boundingBox.maximumWorld.x - c.getBoundingInfo().boundingBox.minimumWorld.x
        var bottomY = c.getBoundingInfo().boundingBox.minimum.y+c.position.y
        if(isFinite(diff) && diff !=0){
          size = Math.max(size, c.getBoundingInfo().boundingBox.maximumWorld.x - c.getBoundingInfo().boundingBox.minimumWorld.x)
          bottom = Math.min(bottom, bottomY)
        }
      })
      //TODO bottom is incorrect?
      console.log(bottom)
      
      //Put objects randomly in arc in from of camera
      parent.position.y = 1+Math.random()*1
      var rot = -Math.PI/2+(Math.PI*Math.random())
      parent.position.x = this._camera.position.x + (Math.sin(rot)*5)//2*(i-objectCount/2)
      parent.position.z = this._camera.position.z + (Math.cos(rot)*5)

      //Scale to be same size
      var desiredSize = 1
      parent.scaling.x = desiredSize/size
      parent.scaling.y = desiredSize/size
      parent.scaling.z = desiredSize/size
    }
  }

  animate(): void {
    // run the render loop
    this._engine.runRenderLoop(() => {
      this._scene.render();
    });

    // the canvas/window resize event handler
    window.addEventListener('resize', () => {
      this._engine.resize();
    });
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  // Create the game using the 'renderCanvas'
  let game = new Game('renderCanvas');

  // Create the scene
  await game.createScene();

  // start animation
  game.animate();
});