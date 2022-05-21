<template>
  <div class="Intersection">
    <div id="aside">
      <fieldset style="width: 350px;">
        <legend>数据导入</legend>
        <label for="layer_input" style="display: block;">
          <span>层位数据：</span>
          <input id="layer_input" type="file">
        </label>
        <label for="fault_input" style="display: block;">
          <span>断层数据：</span>
          <input id="fault_input" type="file">
        </label>
        <button style="float:right" @click="onBtnLoadData">确定</button>
      </fieldset>
      <fieldset style="width: 350px;">
        <legend>交线估计</legend>
        <button @click="getCrossLines">交线求取</button>
        <p style="display: inline;">状态：<span id="stage">无</span></p>
        <button @click="showCrossLines">交线显示</button>
      </fieldset>
      <div ref="description" id="description">
        坐标：(<span ref="d_text">x: 0, y: 0, z: 0</span>)
      </div>
    </div>
    <div ref="state" id="state"></div>
    <div ref="container" id="container" style="width: 80%; height: 100%;"></div>
  </div>
</template>

<script>
  import * as THREE from "./three.module.js";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
  import Stats from "three/examples/jsm/libs/stats.module.js";
  import * as layerData from "./layerData/layerData.json"
  import { Lut } from 'three/examples/jsm/math/Lut.js';
  import { GUI } from 'dat.gui'

  export default {
    name: "Intersection",
    data() {
      return {
        layerFile: null,
        faultFile: null,
        layerData: [],
        faultData: [],
        line1Data: [],
        line2Data: [],
        layerName: '',
        faultName: '',
        line1Name: '',
        line2Name: '',
        layerMesh: null,
        faultMesh: null,
        line1Mesh: null,
        line2Mesh: null,

        scene: null,
        group: null,
        camera: null,
        gui: null,
        pointLight: null,
        ambient: null,
        renderer: null,
        controls: null,
        orbitControls: null,
        stats: null,
        width: 0,
        height: 0,

        options: {
          nodesRadius: 1,
          imgSize: 100,
          layerColor: 0xff0000,
          faultColor: 0x0000ff,
          line1Color: 0x00ff00,
          line2Color: 0xff00ff,
          edgesColor: 0x000000,
          background: false,
          isLightFollowCamera: true,
          layer: true,
          fault: true,
          crossLine1: true,
          crossLine2: true,
          view: {
            lookView: 'default',
            cameraType: 'Orthographic', // 'Perspective'

          },
          frontView: false,
          verticalView: false,
          sideView: false,
          mode: {
            mode: 'point'
          }
        },
        minX: 0,
        minY: 0,
        minZ: 0,
        maxX: 0,
        maxY: 0,
        maxZ: 0,
        mouse: null,
        raycaster: null,
        activeNode: null
      };
    },
    methods: {
      quit() {
        pywebview.api.quit()
      },
      async showCrossLines() {
        this.line1Name = `${this.layerName}-${this.faultName}-L1`
        this.line2Name = `${this.layerName}-${this.faultName}-L2`

        let data1 = await this.loadFile(`./output/${this.line1Name}.txt`);
        data1 = data1.replace(/\s+/ig, " ").trim().split(" ");
        let data2 = await this.loadFile(`./output/${this.line2Name}.txt`);
        data2 = data2.replace(/\s+/ig, " ").trim().split(" ");
        if (!data1[0] || !data2[0]) {
          alert('未生成交线！')
        }
        this.line1Data = []
        this.line2Data = []
        for (let i = 0; i < data1.length; i += 3) {
          data1[i] = Number(data1[i]);
          data1[i + 1] = Number(data1[i + 1]);
          data1[i + 2] = -Number(data1[i + 2]);
          if (data1[i] > this.maxX) {
            this.maxX = data1[i]
          }
          if (data1[i + 1] > this.maxY) {
            this.maxY = data1[i + 1]
          }
          if (data1[i + 2] > this.maxZ) {
            this.maxZ = data1[i + 2]
          }

          if (data1[i] < this.minX) {
            this.minX = data1[i]
          }
          if (data1[i + 1] < this.minY) {
            this.minY = data1[i + 1]
          }
          if (data1[i + 2] < this.minZ) {
            this.minZ = data1[i + 2]
          }
          let node = new THREE.Vector3(data1[i], data1[i + 1], data1[i + 2]);
          this.line1Data.push(node);
        }
        for (let i = 0; i < data2.length; i += 3) {
          data2[i] = Number(data2[i]);
          data2[i + 1] = Number(data2[i + 1]);
          data2[i + 2] = -Number(data2[i + 2]);
          if (data2[i] > this.maxX) {
            this.maxX = data2[i]
          }
          if (data2[i + 1] > this.maxY) {
            this.maxY = data2[i + 1]
          }
          if (data2[i + 2] > this.maxZ) {
            this.maxZ = data2[i + 2]
          }

          if (data2[i] < this.minX) {
            this.minX = data2[i]
          }
          if (data2[i + 1] < this.minY) {
            this.minY = data2[i + 1]
          }
          if (data2[i + 2] < this.minZ) {
            this.minZ = data2[i + 2]
          }
          let node = new THREE.Vector3(data2[i], data2[i + 1], data2[i + 2]);
          this.line2Data.push(node);
        }
        this.updateScene()
      },
      getCrossLines() {

        pywebview.api.getCrossLines(this.layerFile, this.faultFile, this.layerName, this.faultName)
      },
      init() {
        this.initThree();
        this.initScene();
        this.initCamera();
        this.initControls();
        this.initLight();
        this.initGUI();
        this.render();
        this.addListener();
      },
      // 画布初始化
      initThree() {
        this.width = document.querySelector('#container').clientWidth;
        this.height = window.innerHeight;
        console.log(this.width, this.height, document.querySelector('#container'))
        // 防锯齿
        var devicePixelRatio = window.devicePixelRatio;
        this.renderer = new THREE.WebGLRenderer({
          antialias: true,
        });
        this.renderer.setPixelRatio(devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0xffffff, 1);
        this.$refs.container.appendChild(this.renderer.domElement);

        this.stats = new Stats();
        this.stats.dom.style.position = 'relative'
        this.$refs.state.appendChild(this.stats.dom);

        this.mouse = new THREE.Vector2(1, 1);
        this.raycaster = new THREE.Raycaster();
      },
      // 场景初始化
      initScene() {
        this.scene = new THREE.Scene();
      },
      // 相机控制器配置
      initControls() {
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 1;
        this.orbitControls.screenSpacePanning = false;
        this.orbitControls.update();
      },
      // 相机初始化
      initCamera() {
        // 正交相机
        this.camera = new THREE.OrthographicCamera(this.width / - 15, this.width / 15, this.height / 15, this.height / - 15, 1, 1000);

        // 透视相机
        this.camera = new THREE.PerspectiveCamera(
          45,
          this.width / this.height,
          1,
          10000
        );
        this.camera.position.set(200, 200, 200);
        this.camera.up.x = 0;
        this.camera.up.y = 0;
        this.camera.up.z = 1;
        this.camera.lookAt({
          x: 0,
          y: 0,
          z: 0,
        });

      },
      // 光线初始化
      initLight() {
        this.pointLight = new THREE.PointLight(0xffffff);
        this.pointLight.position.set(4000, 2000, 3000);
        this.ambient = new THREE.AmbientLight(0x444444);
        this.scene.add(this.pointLight);
        this.scene.add(this.ambient);
      },
      initObject() {
        this.group = new THREE.Group();
        if (this.layerData && this.options.layer) {
          this.drawNodes(this.layerData, this.options.layerColor, this.layerName);
        }
        if (this.faultData && this.options.fault) {
          this.drawNodes(this.faultData, this.options.faultColor, this.faultName);
          this.drawLine(this.faultData);



        }
        if (this.line1Data && this.options.crossLine1) {
          this.drawNodes(this.line1Data, this.options.line1Color, this.line1Name);
        }
        if (this.line2Data && this.options.crossLine2) {
          this.drawNodes(this.line2Data, this.options.line2Color, this.line2Name);
        }






        this.scene.add(this.group);
        this.initAxis();
      },
      drawNodes(nodesData, color, name) {
        let r = this.options.nodesRadius * 0.1;
        if (name == this.line1Name || name == this.line2Name) {
          r = r * 2
        }

        // var geometry = new THREE.PointsMaterial( { size: 1, vertexColors: true } ); 
        var geometry = new THREE.SphereGeometry(r, 10, 10);
        var material = new THREE.MeshPhongMaterial();
        var mesh = new THREE.InstancedMesh(geometry, material, nodesData.length);

        mesh.name = name;
        for (let i = 0; i < nodesData.length; i++) {
          let matrix = new THREE.Matrix4();
          let position = new THREE.Vector3();
          let rotation = new THREE.Euler();
          let quaternion = new THREE.Quaternion();
          let scale = new THREE.Vector3();
          position.x = this.normalize(nodesData[i].x, this.minX, this.maxX) * this.options.imgSize;
          position.y = this.normalize(nodesData[i].y, this.minY, this.maxY) * this.options.imgSize;
          position.z = this.normalize(nodesData[i].z, this.minZ, this.maxZ) * this.options.imgSize;
          rotation.x = 0;
          rotation.y = 0;
          rotation.z = 0;

          quaternion.setFromEuler(rotation);

          scale.x = scale.y = scale.z = 1;

          matrix.compose(position, quaternion, scale);
          mesh.setMatrixAt(i, matrix);
          mesh.setColorAt(i, new THREE.Color(color));
        }
        this.group.add(mesh);
        if (name == this.layerName) {
          this.layerMesh = mesh
        }
        else if (name == this.faultName) {
          this.faultMesh = mesh
        }
        else if (name == this.line1Name) {
          this.line1Mesh = mesh
        }
        else if (name == this.line2Name) {
          this.line2Mesh = mesh
        }

      },
      drawLine(nodes) {
        var geometry = new THREE.BufferGeometry();
        var vBuff = [];
        var colors = [];

        for (let i = 0; i < nodes.length; i++) {
          vBuff.push(this.normalize(nodes[i].x, this.minX, this.maxX) * this.options.imgSize,
            this.normalize(nodes[i].y, this.minY, this.maxY) * this.options.imgSize,
            this.normalize(nodes[i].z, this.minZ, this.maxZ) * this.options.imgSize
          );
          colors.push(
            1, 1, 0
          )
        }
        var vertices = new Float32Array(vBuff);
        var attribue = new THREE.BufferAttribute(vertices, 3);

        var color = new Float32Array(colors);
        geometry.attributes.color = new THREE.BufferAttribute(color, 3);
        geometry.attributes.position = attribue;
        geometry.computeVertexNormals();
        // geometry.computeFaceNormals();

        const material = new THREE.MeshLambertMaterial({
          side: THREE.DoubleSide,
          vertexColors: THREE.VertexColors,
        });
        const wireframe = new THREE.WireframeGeometry(geometry);

        const line = new THREE.LineSegments(wireframe);
        line.material.depthTest = false;
        line.material.opacity = 0.25;
        line.material.transparent = true;
        line.material.color = new THREE.Color(this.options.edgesColor);
        const mesh = new THREE.Mesh(geometry, material);
        let group = new THREE.Group();
        group.name = 'edge'
        if(this.options.mode.mode == 'wirefame') {
          group.add(line);
          this.group.add(line);
        } else if(this.options.mode.mode == 'mesh') {
          group.add(line);
          this.group.add(mesh);
        }

      },
      initGUI() {
        this.gui = new GUI();
        var folderGeometry = this.gui.addFolder('Geometry');
        var _this = this;
        folderGeometry.add(this.options, 'nodesRadius', 1, 10).onChange(this.updateScene);
        folderGeometry.add(this.options, 'imgSize', 100, 500).onChange(this.updateScene);
        folderGeometry.addColor(this.options, 'layerColor').onChange(this.updateScene);
        folderGeometry.addColor(this.options, 'faultColor').onChange(this.updateScene);
        folderGeometry.addColor(this.options, 'line1Color').onChange(this.updateScene);
        folderGeometry.addColor(this.options, 'line2Color').onChange(this.updateScene);
        folderGeometry.addColor(this.options, 'edgesColor').onChange(this.updateScene);

        folderGeometry.add(this.options, 'background').onChange(this.onBgChange);

        folderGeometry.add(this.options, 'isLightFollowCamera').onChange(function () {

        });
        folderGeometry.add(this.options, 'layer').onChange(this.updateScene);
        folderGeometry.add(this.options, 'fault').onChange(this.updateScene);
        folderGeometry.add(this.options, 'crossLine1').onChange(this.updateScene);
        folderGeometry.add(this.options, 'crossLine2').onChange(this.updateScene);

        var viewFolder = this.gui.addFolder('View');

        viewFolder.add(this.options.view, 'lookView').options(['default', 'frontView', 'verticalView', 'sideView']).onChange(this.updateCamera);;
        viewFolder.add(this.options.view, 'cameraType').options(['Perspective', 'Orthographic']).onChange(this.updateCamera);;

        var modeFolder = this.gui.addFolder('Mode');

        modeFolder.add(this.options.mode, 'mode').options(['default', 'wirefame', 'mesh', 'point']).onChange(this.updateScene);

        modeFolder.open();
        folderGeometry.open();
        viewFolder.open();

      },
      updateCamera() {
        if (this.options.view.cameraType == 'Perspective') {
          this.camera = new THREE.PerspectiveCamera(
            45,
            this.width / this.height,
            1,
            10000
          );
          this.initControls()

        }
        else if (this.options.view.cameraType == 'Orthographic') {
          this.camera = new THREE.OrthographicCamera(this.width / - 15, this.width / 15, this.height / 15, this.height / - 15, 1, 1000);
          this.initControls()

        }
        if (this.options.view.lookView == 'frontView') {
          this.camera.position.set(200, 0, 0)
          this.camera.lookAt({
            x: 0,
            y: 0,
            z: 0,
          });
          this.options.verticalView = false;
          this.options.sideView = false;
        }
        else if (this.options.view.lookView == 'verticalView') {
          this.camera.position.set(0, 0, 200)
          this.camera.lookAt({
            x: 0,
            y: 0,
            z: 0,
          });
          this.options.sideView = false;
          this.options.frontView = false;

        }
        else if (this.options.view.lookView == 'sideView') {
          this.camera.position.set(0, 200, 0)
          this.camera.lookAt({
            x: 0,
            y: 0,
            z: 0,
          });
          this.options.verticalView = false;
          this.options.frontView = false;
        }
        else if (this.options.view.lookView == 'default') {
          this.camera.position.set(200, 200, 200)
          this.camera.lookAt({
            x: 0,
            y: 0,
            z: 0,
          });
          this.options.verticalView = false;
          this.options.frontView = false;
        }
        this.camera.up.x = 0;
        this.camera.up.y = 0;
        this.camera.up.z = 1;
        this.orbitControls.update();

      },
      onBgChange(e) {
        var bgcolor;
        if (this.options.background) {
          bgcolor = 0x000000;
        } else {
          bgcolor = 0xf0f0f0;
        }
        this.renderer.setClearColor(bgcolor, 1);
      },
      // 渲染器
      render() {
        this.renderer.clear();
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersection = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersection.length > 0 && intersection[0].object.geometry.type == "SphereGeometry") {
          let description = this.$refs.description;
          let descriptionText = this.$refs.d_text;
          let color = new THREE.Color()
          let startx = 0;
          let starty = 0;
          let startz = 0;
          let data;
          let mesh;
          const instanceId = intersection[0].instanceId;

          if (intersection[0].object.name == this.layerName) {
            data = this.layerData;
            mesh = this.layerMesh;
          } else if (intersection[0].object.name == this.faultName) {
            data = this.faultData;
            mesh = this.faultMesh;
          } else if (intersection[0].object.name == this.line1Name) {
            data = this.line1Data;
            mesh = this.line1Mesh;
          } else if (intersection[0].object.name == this.line2Name) {
            data = this.line2Data;
            mesh = this.line2Mesh;
          } else {
            return
          }

          if (this.activeNode) {
            this.activeNode.parent.setColorAt(this.activeNode.id, this.activeNode.color);
          }
          this.activeNode = {
            id: instanceId,
            color: new THREE.Color(),
            parent: mesh
          }
          mesh.getColorAt(instanceId, this.activeNode.color);
          console.log(this.activeNode)
          startx = data[instanceId].x;
          starty = data[instanceId].y;
          startz = data[instanceId].z;
          mesh.instanceColor.needsUpdate = true;
          mesh.setColorAt(instanceId, new THREE.Color(0xffffff));
          mesh.instanceColor.needsUpdate = true;

          descriptionText.innerHTML = `[${intersection[0].object.name}], x: ${startx}, y: ${starty}, z: ${startz}`;


        }


        this.renderer.render(this.scene, this.camera);
        this.lightFollowCamera();

        this.stats.update();
        requestAnimationFrame(this.render);
      },
      lightFollowCamera() {
        if (this.options.isLightFollowCamera) {
          this.pointLight.position.copy(this.camera.position);
        } else {
          this.pointLight.position.set(4000, 2000, 3000);
        }
      },
      getSelectObj(mouse, raycaster, e) {
        mouse.x = (e.clientX - document.querySelector('#container').offsetLeft) / (this.renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(e.clientY / this.renderer.domElement.clientHeight * 2) + 1;
        raycaster.setFromCamera(mouse, this.camera);//以camera为z坐标，确定所点击物体的3D空间位置
        let intersects = raycaster.intersectObjects(this.scene.children, true);//确定所点击位置上的物体数量集合
        return intersects;//返回连线经过的物体集合
      },
      updateScene() {
        if (this.group) {
          let meshs = [];
          this.group.traverse(function (obj) {
            if (obj.type === 'Mesh') {
              meshs.push(obj);
            }
          })
          for (let i = 0; i < meshs.length; i++) {
            let mesh = meshs[i];
            meshs[i].geometry.dispose();
            meshs[i].material.dispose();
          }
          this.scene.remove(this.group);
        }

        this.initObject();
      },
      // 坐标轴初始化
      initAxis() {
        //中心定位坐标轴
        let axisHelper = new THREE.AxesHelper(this.options.imgSize);
        this.group.add(axisHelper);
      },
      // 窗口大小变换事件
      onWindowResize(e) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      },
      onDocumentMouseMove(e) {
        if (!this.group) return

        this.mouse.x = (e.clientX - document.querySelector('#container').offsetLeft) / (this.renderer.domElement.clientWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / this.renderer.domElement.clientHeight * 2) + 1;


      },
      onBtnLoadData(e) {
        this.layerFile = this.getObjectURL(document.querySelector('#layer_input').files[0]);
        this.faultFile = this.getObjectURL(document.querySelector('#fault_input').files[0]);
        this.layerName = document.querySelector('#layer_input').files[0].name.split(".")[0];
        this.faultName = document.querySelector('#fault_input').files[0].name.split(".")[0];
        this.layerData = []
        this.faultData = []
        const ldata = this.loadFile(this.layerFile).replace(/\s+/ig, " ").trim().split(" ");
        const fdata = this.loadFile(this.faultFile).replace(/\s+/ig, " ").trim().split(" ");
        let minX = 99999;
        let minY = 99999;
        let minZ = 99999;
        let maxX = -99999;
        let maxY = -99999;
        let maxZ = -99999;
        for (let i = 0; i < ldata.length; i += 3) {
          ldata[i] = Number(ldata[i]);
          ldata[i + 1] = Number(ldata[i + 1]);
          ldata[i + 2] = Number(ldata[i + 2]);
          if (ldata[i] > maxX) {
            maxX = ldata[i]
          }
          if (ldata[i + 1] > maxY) {
            maxY = ldata[i + 1]
          }
          if (ldata[i + 2] > maxZ) {
            maxZ = ldata[i + 2]
          }

          if (ldata[i] < minX) {
            minX = ldata[i]
          }
          if (ldata[i + 1] < minY) {
            minY = ldata[i + 1]
          }
          if (ldata[i + 2] < minZ) {
            minZ = ldata[i + 2]
          }
          let node = new THREE.Vector3(ldata[i], ldata[i + 1], ldata[i + 2]);
          this.layerData.push(node);
        }
        for (let i = 0; i < fdata.length; i += 3) {
          fdata[i] = Number(fdata[i]);
          fdata[i + 1] = Number(fdata[i + 1]);
          fdata[i + 2] = Number(fdata[i + 2]);
          if (fdata[i] > maxX) {
            maxX = fdata[i]
          }
          if (fdata[i + 1] > maxY) {
            maxY = fdata[i + 1]
          }
          if (fdata[i + 2] > maxZ) {
            maxZ = fdata[i + 2]
          }

          if (fdata[i] < minX) {
            minX = fdata[i]
          }
          if (fdata[i + 1] < minY) {
            minY = fdata[i + 1]
          }
          if (fdata[i + 2] < minZ) {
            minZ = fdata[i + 2]
          }
          let node = new THREE.Vector3(fdata[i], fdata[i + 1], fdata[i + 2]);
          this.faultData.push(node);
        }
        this.minX = minX;
        this.minY = minY;
        this.minZ = minZ;
        this.maxX = maxX;
        this.maxY = maxY;
        this.maxZ = maxZ;

        this.updateScene();

      },
      normalize(x, min, max) {
        return (x - min) / (max - min)
      },


      loadFile(name) { // name为文件所在位置
        let xhr = new XMLHttpRequest();
        var okStatus = document.location.protocol === "file:" ? 0 : 200;
        xhr.open('GET', name, false);
        xhr.overrideMimeType("text/html;charset=utf-8");
        xhr.send(null);
        return xhr.status === okStatus ? xhr.responseText : null;
      },
      getObjectURL(file) {
        var url = null;
        if (window.createObjcectURL != undefined) {
          url = window.createOjcectURL(file);
        } else if (window.URL != undefined) {
          url = window.URL.createObjectURL(file);
        } else if (window.webkitURL != undefined) {
          url = window.webkitURL.createObjectURL(file);
        }
        return url;
      },
      addListener() {
        window.addEventListener("resize", this.onWindowResize, false);
        document.addEventListener('mousemove', this.onDocumentMouseMove, false);


      },
    },
    mounted() {
      this.init();
    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .Intersection {
    overflow: hidden;
  }

  #aside {
    float: left;
    width: 20%;
  }

  #container {
    float: left;

  }

  #state {
    position: absolute;
    left: 20%;
  }

  #description {
    margin: 10px;
  }
</style>