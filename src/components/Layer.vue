<template>
  <div class="Layer">
    <div ref="container"></div>
  </div>
</template>

<script>
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module.js";
import * as layerData from "./layerData/layerData.json"
import { Lut } from 'three/examples/jsm/math/Lut.js';
export default {
  name: "Layer",
  data() {
    return {
      layerData: [layerData],
      scene: null,
      group: null,
      camera: null,
      pointLight: null,
      ambient: null,
      renderer: null,
      controls: null,
      orbitControls: null,
      stats: null,
      width: 0,
      height: 0,

      options: {
        imgSize: 100,
      },
    };
  },
  methods: {
    init() {
      this.group = new THREE.Group();
      this.initThree();
      this.initScene();
      this.initCamera();
      this.initControls();
      this.initLight();
      this.initObject();
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

      this.stats = new Stats();
      this.$refs.container.appendChild(this.stats.dom);
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
      this.orbitControls.maxPolarAngle = Math.PI / 2;
      this.orbitControls.update();
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
    // 光线初始化
    initLight() {
      this.pointLight = new THREE.PointLight(0xffffff);
      this.pointLight.position.set(4000, 2000, 3000);
      this.ambient = new THREE.AmbientLight(0x444444);
      this.scene.add(this.pointLight);
      this.scene.add(this.ambient);
    },
    initObject() {
      for(let j = 0; j <  this.layerData.length; j ++) {
        var faces = this.layerData[j].faces;
        var vBuff = []
        var gridPosition = this.layerData[j].grid.positions;
        var crossPosition = this.layerData[j].crossPoint.positions;
        var colors = [];

        for(let i = 0; i < faces.length; i ++){
          var face = faces[i]
          for(let j = 0; j < 3;j ++) {
            if(face[j] < 100000) {
              vBuff.push(gridPosition[face[j]][0] * this.options.imgSize)
              vBuff.push(gridPosition[face[j]][2] * this.options.imgSize)
              vBuff.push(gridPosition[face[j]][1] * this.options.imgSize)
              colors.push(
                1, 1 , gridPosition[face[j]][2]
              )
            } else {
              vBuff.push(crossPosition[face[j] - 100000][0] * this.options.imgSize)
              vBuff.push(crossPosition[face[j] - 100000][2] * this.options.imgSize)
              vBuff.push(crossPosition[face[j] - 100000][1] * this.options.imgSize)
              colors.push(
                1, 1, crossPosition[face[j] - 100000][2],  
              )
            }
          }
        }

        var geometry = new THREE.BufferGeometry();
        var vertices = new Float32Array(vBuff);
        var attribue = new THREE.BufferAttribute(vertices, 3);
        var color = new Float32Array(colors);
        geometry.attributes.color = new THREE.BufferAttribute(color, 3);
        geometry.attributes.position = attribue;
        geometry.computeVertexNormals();
        geometry.computeFaceNormals();

        var material = new THREE.MeshLambertMaterial({
          side: THREE.DoubleSide,
          vertexColors: THREE.VertexColors,
        });
        var mesh = new THREE.Mesh(geometry, material); 
        this.group.add(mesh);


        
        var lut = new Lut();
        var params = {
           colorMap: 'rainbow',
        };

        lut.setColorMap( params.colorMap );

        lut.setMax(1);
        lut.setMin(0);
        geometry = mesh.geometry;
        colors = geometry.attributes.color;

        for ( var i = 0; i < color.length/3; i ++ ) {
          var colorValue = color[i*3 + 2];
          var newcolor = lut.getColor(colorValue);
          colors.setXYZ( i, newcolor.r, newcolor.g, newcolor.b );
        }
      }
      this.scene.add(this.group);
      this.initAxis();
    },
    // 渲染器
    render() {
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
      this.stats.update();
      requestAnimationFrame(this.render);
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
    addListener() {
      window.addEventListener("resize", this.onWindowResize, false);
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
