<template>
  <div class="Seismic">
    <div ref="container"></div>
  </div>
</template>

<script>
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { GUI } from "dat.gui";
export default {
  name: "Tree",
  data() {
    return {
      scene: null,
      group: null,
      camera: null,
      pointLight: null,
      ambient: null,
      renderer: null,
      controls: null,
      orbitControls: null,
      transformControls: null,

      width: 0,
      height: 0,

      options: {
        nodesNumber: 10,
        edgesNumber: 10,
        nodesDistance: 3,
        nodesRadius: 10,
        imgSize: 100,
        randomSize: 50,
        color: 0xff00ff,
        background: true,
        isLightFollowCamera: false,
      },

      divisions: 20,

      data: {
        nodes: [],
        edges: [],
      },
    };
  },
  methods: {
    init() {
      this.initThree();
      this.initScene();
      this.initCamera();
      this.initControls();
      this.initLight();
      this.initObject();
      // this.initGUI();
      this.render();
      this.addListener();
    },
    // 画布初始化
    initThree() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      // 防锯齿
      var devicePixelRatio = window.devicePixelRatio;
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
      });
      this.renderer.setPixelRatio(devicePixelRatio);
      this.renderer.setSize(this.width, this.height);
      this.renderer.setClearColor(0x000000, 1);
      this.$refs.container.appendChild(this.renderer.domElement);
    },
    // 场景初始化
    initScene() {
      this.scene = new THREE.Scene();
    },

    // 相机初始化
    initCamera() {
      // 正交相机
      // this.camera = new OrthographicCamera(this.width / - 2, this.width / 2, this.height / 2,   this.height / - 2, 0, 10000);

      // 透视相机
      this.camera = new THREE.PerspectiveCamera(
        45,
        this.width / this.height,
        1,
        10000
      );
      this.camera.position.set(300, 300, 300);
      this.camera.up.x = 0;
      this.camera.up.y = 1;
      this.camera.up.z = 0;
      this.camera.lookAt({
        x: 0,
        y: 0,
        z: 0,
      });
    },
    // 相机控制器配置
    initControls() {
      this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
      this.orbitControls.enableDamping = true;
      this.orbitControls.dampingFactor = 1;
      this.orbitControls.screenSpacePanning = false;
      this.orbitControls.maxPolarAngle = Math.PI / 2;

      this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
      this.transformControls.addEventListener("change", this.render);

      this.transformControls.addEventListener("dragging-changed", function (event) {
        this.orbitControls.enabled = !event.value;
      });
    },
    // 光线初始化
    initLight() {
      // 点光源
      this.pointLight = new THREE.PointLight(0xffffff);
      this.pointLight.position.set(4000, 2000, 3000);
      // 环境光
      this.ambient = new THREE.AmbientLight(0x444444);
      this.scene.add(this.pointLight);
      this.scene.add(this.ambient);
    },

    createCube(x, y, z) {
      var cubeG = new THREE.BoxGeometry(x, y, z);
      var path = "../../../static/textures/";
      var format = ".png";
      var urls = [
        path + "02" + format, // 右前
        path + "02" + format, // 右后
        path + "03" + format, // 上
        path + "03" + format, // 下
        path + "01" + format, // 左前
        path + "01" + format, // 左后
      ]; //加载6张图
      var maps = [];
      for (var i = 0; i < urls.length; i++) {
        var texture = new THREE.TextureLoader().load(urls[i]);
        switch (i) {
          case 2:
          // texture.rotation = Math.PI / 2;
          // texture.center.set(50, 50);
        }
        maps.push(
          new THREE.MeshPhongMaterial({
            map: texture,
          })
        );
      }

      return new THREE.Mesh(cubeG, maps);
    },
    initObject() {
      this.group = new THREE.Group();
      var cube = this.createCube(100, 100, 100);
      this.group.add(cube);
      this.initAxis();
      this.scene.add(this.group);
    },
    // GUI初始化
    initGUI() {
      var gui = new GUI();
      var folderGeometry = gui.addFolder("Geometry");
      var _this = this;
      folderGeometry
        .add(this.options, "nodesNumber", 1, 1000000)
        .onChange(this.updateScene);
      folderGeometry
        .add(this.options, "edgesNumber", 1, 5000)
        .onChange(this.updateScene);
      folderGeometry
        .add(this.options, "nodesDistance", 1, 20)
        .onChange(this.updateScene);
      folderGeometry
        .add(this.options, "nodesRadius", 1, 10)
        .onChange(this.updateScene);
      folderGeometry
        .add(this.options, "imgSize", 100, 500)
        .onChange(this.updateScene);
      folderGeometry
        .add(this.options, "randomSize", 50, 200)
        .onChange(this.updateScene);
      folderGeometry.addColor(this.options, "color").onChange(function () {
        _this.group.children[0].material.color.set(_this.options.color);
      });

      folderGeometry.add(this.options, "background").onChange(this.onBgChange);

      folderGeometry
        .add(this.options, "isLightFollowCamera")
        .onChange(function () {});

      folderGeometry.open();
    },
    // 背景颜色切换
    onBgChange(e) {
      var bgcolor;
      if (this.options.background) {
        bgcolor = 0x000000;
      } else {
        bgcolor = 0xf0f0f0;
      }
      this.renderer.setClearColor(bgcolor, 1);
      this.group.children.forEach(function (e) {
        if (e.name == "edges") {
          e.children.forEach(function (g) {
            g.material.color.set(0xffffff - bgcolor);
          });
        } else if (e.name == "Axis") {
          e.children.forEach(function (g) {
            g.children.forEach(function (m) {
              m.material.color.set(0xffffff - bgcolor);
            });
          });
        }
      });
    },
    // 随机矩阵生成
    randomizeMatrix(matrix) {
      let position = new THREE.Vector3();
      let rotation = new THREE.Euler();
      let quaternion = new THREE.Quaternion();
      let scale = new THREE.Vector3();

      position.x =
        Math.floor(
          Math.random() * this.options.randomSize - this.options.randomSize / 2
        ) * this.options.nodesDistance;
      position.y =
        Math.floor(
          Math.random() * this.options.randomSize - this.options.randomSize / 2
        ) * this.options.nodesDistance;
      position.z =
        Math.floor(
          Math.random() * this.options.randomSize - this.options.randomSize / 2
        ) * this.options.nodesDistance;
      this.data.nodes.push([position.x, position.y, position.z]);

      rotation.x = 0;
      rotation.y = 0;
      rotation.z = 0;

      quaternion.setFromEuler(rotation);

      scale.x = scale.y = scale.z = 1;

      matrix.compose(position, quaternion, scale);
    },
    // 渲染器
    render() {
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
      // 光照跟随相机
      this.lightFollowCamera();
      // 坐标轴视图更新
      this.axisUpdate();
      // requestAnimationFrame(this.render);
    },
    // 坐标轴初始化
    initAxis() {
      //中心定位坐标轴
      let axisHelper = new THREE.AxesHelper(this.options.imgSize);
      this.group.add(axisHelper);

      var groupAxis = new THREE.Group();
      groupAxis.name = "Axis";
      var groupxz = new THREE.Group();
      groupxz.name = "planeXZ";
      var groupxy = new THREE.Group();
      groupxy.name = "planeXY";
      var groupyz = new THREE.Group();
      groupyz.name = "planeYZ";
      var groupTextX = new THREE.Group();
      groupTextX.name = "textX";
      var groupTextY = new THREE.Group();
      groupTextY.name = "textY";
      var groupTextZ = new THREE.Group();
      groupTextZ.name = "textZ";
      var strX = new THREE.Group();
      strX.name = "strX";
      var strY = new THREE.Group();
      strY.name = "strY";
      var strZ = new THREE.Group();
      strZ.name = "strZ";
      var material = new THREE.LineBasicMaterial({
        color: 0xffffff,
      });
      //x-z面
      var geometryXZ = new THREE.Geometry();
      geometryXZ.vertices.push(new THREE.Vector3(-this.options.imgSize, 0, 0));
      geometryXZ.vertices.push(new THREE.Vector3(this.options.imgSize, 0, 0));
      for (let i = 0; i <= (this.options.imgSize * 2) / this.divisions; i++) {
        var linex = new THREE.Line(geometryXZ, material);
        linex.position.z = i * this.divisions - this.options.imgSize;
        var liney = new THREE.Line(geometryXZ, material);
        liney.position.x = i * this.divisions - this.options.imgSize;
        liney.rotation.y = (Math.PI * 3) / 2;
        groupxz.add(linex);
        groupxz.add(liney);
      }
      groupAxis.add(groupxz);

      //x-y面

      var geometryXY = new THREE.Geometry();
      geometryXY.vertices.push(new THREE.Vector3(-this.options.imgSize, 0, 0));
      geometryXY.vertices.push(new THREE.Vector3(this.options.imgSize, 0, 0));
      for (let i = 0; i <= (this.options.imgSize * 2) / this.divisions; i++) {
        var linex = new THREE.Line(geometryXY, material);
        linex.position.y = i * this.divisions - this.options.imgSize;
        var liney = new THREE.Line(geometryXY, material);
        liney.position.x = i * this.divisions - this.options.imgSize;
        liney.rotation.z = (Math.PI * 3) / 2;
        groupxy.add(linex);
        groupxy.add(liney);
      }
      groupAxis.add(groupxy);
      //y-z面

      var geometryYZ = new THREE.Geometry();
      geometryYZ.vertices.push(new THREE.Vector3(0, 0, -this.options.imgSize));
      geometryYZ.vertices.push(new THREE.Vector3(0, 0, this.options.imgSize));
      for (let i = 0; i <= (this.options.imgSize * 2) / this.divisions; i++) {
        var linex = new THREE.Line(geometryYZ, material);
        linex.position.y = i * this.divisions - this.options.imgSize;
        groupyz.add(linex);
        var liney = new THREE.Line(geometryYZ, material);
        liney.position.z = i * this.divisions - this.options.imgSize;
        liney.rotation.x = (Math.PI * 3) / 2;
        groupyz.add(liney);
      }
      groupAxis.add(groupyz);

      // 网格坐标数字刻度
      for (let i = 0; i <= (this.options.imgSize * 2) / this.divisions; i++) {
        var textx = this.makeTextSprite(
          Math.ceil(i * this.divisions - this.options.imgSize),
          {
            fontsize: 18,
            fontface: "Georgia",
          }
        );

        var texty = this.makeTextSprite(
          Math.ceil(i * this.divisions - this.options.imgSize),
          {
            fontsize: 18,
            fontface: "Georgia",
          }
        );
        var textz = this.makeTextSprite(
          Math.ceil(i * this.divisions - this.options.imgSize),
          {
            fontsize: 18,
            fontface: "Georgia",
          }
        );
        textx.center = new THREE.Vector2(0.1, 1);
        textx.position.set(i * this.divisions - this.options.imgSize, 0, 0);

        texty.center = new THREE.Vector2(0, 1);
        texty.position.set(0, 0, i * this.divisions - this.options.imgSize);

        textz.center = new THREE.Vector2(0.1, 0.9);
        textz.position.set(0, i * this.divisions - this.options.imgSize, 0);

        groupTextX.add(textx);
        groupTextY.add(texty);
        groupTextZ.add(textz);
      }

      groupAxis.add(groupTextX);
      groupAxis.add(groupTextY);
      groupAxis.add(groupTextZ);

      // xyz标识
      var str = this.makeTextSprite("X", {
        fontsize: 36,
        fontface: "Georgia",
      });
      str.center = new THREE.Vector2(0, 1);
      str.position.set(0, 0, 30);
      strX.add(str);

      var str = this.makeTextSprite("Y", {
        fontsize: 36,
        fontface: "Georgia",
      });
      str.center = new THREE.Vector2(0, 1);
      str.position.set(0, 0, 0);
      strY.add(str);

      var str = this.makeTextSprite("Z", {
        fontsize: 36,
        fontface: "Georgia",
      });
      str.center = new THREE.Vector2(0, 1);
      str.position.set(0, 0, 0);
      strZ.add(str);

      groupAxis.add(strX);
      groupAxis.add(strY);
      groupAxis.add(strZ);

      // 动态定位轴
      var coverx = new THREE.Group();
      coverx.name = "coverX";
      var coverLine = new THREE.Geometry();
      coverLine.vertices.push(new THREE.Vector3(0, 0, 0));
      coverLine.vertices.push(new THREE.Vector3(0, 0, 0));

      var line = new THREE.Line(coverLine, material);
      coverx.add(line);

      var covery = new THREE.Group();
      covery.name = "coverY";
      covery.add(line.clone());
      var coverz = new THREE.Group();
      coverz.name = "coverZ";
      coverz.add(line.clone());
      groupAxis.add(coverx);
      groupAxis.add(covery);
      groupAxis.add(coverz);
      this.group.add(groupAxis);
    },
    // 字体生成
    makeTextSprite(message, parameters) {
      if (parameters === undefined) parameters = {};

      var fontface = parameters.hasOwnProperty("fontface")
        ? parameters["fontface"]
        : "Arial";

      var fontsize = parameters.hasOwnProperty("fontsize")
        ? parameters["fontsize"]
        : 18;

      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      context.font = "Bold " + fontsize + "px " + fontface;

      var metrics = context.measureText(message);

      context.fillStyle = "rgba(255, 255, 255, 1.0)";
      context.fillText(message, 0, fontsize);

      var texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;

      var spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        sizeAttenuation: true,
      });
      var sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(100, 50, 1.0);
      return sprite;
    },
    // 光照跟随相机
    lightFollowCamera() {
      if (this.options.isLightFollowCamera) {
        this.pointLight.position.copy(this.camera.position);
      } else {
        this.pointLight.position.set(4000, 2000, 3000);
      }
    },
    // 场景更新
    updateScene() {
      let meshs = [];

      this.group.traverse(function (obj) {
        if (obj.type === "Mesh" || obj.type === "Line") {
          meshs.push(obj);
        }
      });
      for (let i = 0; i < meshs.length; i++) {
        let mesh = meshs[i];
        meshs[i].geometry.dispose();
        meshs[i].material.dispose();
      }
      this.scene.remove(this.group);

      this.data = {
        nodes: [],
        edges: [],
      };
      this.initObject();
    },
    // 坐标轴更新
    axisUpdate() {
      let planeXZ,
        planeXY,
        planeYZ,
        textX,
        textY,
        textZ,
        strX,
        strY,
        strZ,
        coverX,
        coverY,
        coverZ;

      this.group.children.forEach(function (e) {
        if (e.name == "Axis") {
          for (let i = 0; i < e.children.length; i++) {
            if (e.children[i].name == "planeXZ") {
              planeXZ = e.children[i];
            } else if (e.children[i].name == "planeXY") {
              planeXY = e.children[i];
            } else if (e.children[i].name == "planeYZ") {
              planeYZ = e.children[i];
            } else if (e.children[i].name == "textX") {
              textX = e.children[i];
            } else if (e.children[i].name == "textY") {
              textY = e.children[i];
            } else if (e.children[i].name == "textZ") {
              textZ = e.children[i];
            } else if (e.children[i].name == "strX") {
              strX = e.children[i];
            } else if (e.children[i].name == "strY") {
              strY = e.children[i];
            } else if (e.children[i].name == "strZ") {
              strZ = e.children[i];
            } else if (e.children[i].name == "coverX") {
              coverX = e.children[i];
            } else if (e.children[i].name == "coverY") {
              coverY = e.children[i];
            } else if (e.children[i].name == "coverZ") {
              coverZ = e.children[i];
            }
          }
        }
      });

      if (
        this.camera.rotation._z > 0 &&
        this.camera.rotation._z < Math.PI / 2
      ) {
        planeXY.position.z = -this.options.imgSize;
        planeYZ.position.x = -this.options.imgSize;
        planeXZ.position.y = -this.options.imgSize;

        textX.position.z = this.options.imgSize + 3;
        textX.position.y = -this.options.imgSize;
        strX.position.z = this.options.imgSize + 10;
        strX.position.y = -this.options.imgSize;

        textY.position.x = this.options.imgSize + 3;
        textY.position.y = -this.options.imgSize;
        strZ.position.x = this.options.imgSize + 30;
        strZ.position.y = -this.options.imgSize;

        textZ.position.z = this.options.imgSize;
        textZ.position.x = -this.options.imgSize;
        strY.position.z = this.options.imgSize + 30;
        strY.position.x = -this.options.imgSize;
      } else if (
        this.camera.rotation._z > Math.PI / 2 &&
        this.camera.rotation._z < Math.PI
      ) {
        planeXY.position.z = this.options.imgSize;
        planeYZ.position.x = -this.options.imgSize;

        textX.position.z = -this.options.imgSize - 5;
        textX.position.y = -this.options.imgSize;
        strX.position.z = -this.options.imgSize - 60;
        strX.position.y = -this.options.imgSize;

        textY.position.x = this.options.imgSize + 3;
        textY.position.y = -this.options.imgSize;
        strZ.position.x = this.options.imgSize + 30;
        strZ.position.y = -this.options.imgSize;

        textZ.position.z = -this.options.imgSize - 10;
        strY.position.z = -this.options.imgSize - 30;
        strY.position.x = -this.options.imgSize;
      } else if (
        this.camera.rotation._z > -Math.PI &&
        this.camera.rotation._z < -Math.PI / 2
      ) {
        planeXY.position.z = this.options.imgSize;
        planeYZ.position.x = this.options.imgSize;

        textX.position.z = -this.options.imgSize - 5;
        textX.position.y = -this.options.imgSize;
        strX.position.z = -this.options.imgSize - 60;
        strX.position.y = -this.options.imgSize;

        textY.position.x = -this.options.imgSize - 3;
        textY.position.y = -this.options.imgSize;
        strZ.position.x = -this.options.imgSize - 30;
        strZ.position.y = -this.options.imgSize;

        textZ.position.z = this.options.imgSize;
        textZ.position.x = -this.options.imgSize - 10;
        strY.position.z = this.options.imgSize;
        strY.position.x = -this.options.imgSize - 30;
      } else if (
        this.camera.rotation._z > -Math.PI / 2 &&
        this.camera.rotation._z < 0
      ) {
        planeXY.position.z = -this.options.imgSize;
        textX.position.z = this.options.imgSize + 3;
        textX.position.y = -this.options.imgSize;
        strX.position.z = this.options.imgSize + 10;
        strX.position.y = -this.options.imgSize;

        planeYZ.position.x = this.options.imgSize;
        textY.position.x = -this.options.imgSize - 5;
        textY.position.y = -this.options.imgSize;
        strZ.position.x = -this.options.imgSize - 30;
        strZ.position.y = -this.options.imgSize;

        textZ.position.z = -this.options.imgSize;
        textZ.position.x = -this.options.imgSize;
        strY.position.z = -this.options.imgSize;
        strY.position.x = -this.options.imgSize - 30;
      }
    },
    // 获取鼠标选择对象
    getSelectObj(mouse, raycaster, e) {
      mouse.x = (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY / this.renderer.domElement.clientHeight) * 2) + 1;
      raycaster.setFromCamera(mouse, this.camera); //以camera为z坐标，确定所点击物体的3D空间位置
      let intersects = raycaster.intersectObjects(this.scene.children, true); //确定所点击位置上的物体数量集合
      return intersects; //返回连线经过的物体集合
    },
    // 增加事件
    addListener() {
      document.addEventListener("mousemove", this.onDocumentMouseMove, false);
      window.addEventListener("resize", this.onWindowResize, false);
    },
    // 窗口大小变换事件
    onWindowResize(e) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    // 鼠标移动事件
    onDocumentMouseMove(e) {
      let raycaster = new THREE.Raycaster();
      let mouse = new THREE.Vector2();
      let intersectsObjArr = this.getSelectObj(mouse, raycaster, e);
      // let description = this.$refs.description;
      // let descriptionText = this.$refs.d_text;
      // let startx = 0;
      // let starty = 0;
      // let startz = 0;
      // if(intersectsObjArr.length > 0 && intersectsObjArr[0].object.geometry.type == "SphereGeometry"){
      // // 所选目标坐标
      // startx = this.data.nodes[intersectsObjArr[0].instanceId][0];
      // starty = this.data.nodes[intersectsObjArr[0].instanceId][1];
      // startz = this.data.nodes[intersectsObjArr[0].instanceId][2];

      //   description.style.top = e.pageY+"px";
      //   description.style.left = e.pageX + 10 +"px";
      //   description.style.cursor = "pointer";
      //   description.style.display = "block";
      //   descriptionText.innerHTML = `x: ${startx}, y: ${starty}, z: ${startz}( id: ${intersectsObjArr[0].instanceId})`;
      // } else {
      //   description.style.display = "none";
      //   description.style.cursor = "default";
      // }
    },
  },
  mounted() {
    this.init();
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
