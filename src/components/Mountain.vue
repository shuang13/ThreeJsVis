<template>
  <div class="Mountain">
    
    <div ref="container"></div>
  </div>
</template>

<script>


import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { GUI } from 'dat.gui'
import { Lut } from 'three/examples/jsm/math/Lut.js';
export default {
  name: 'Mountain',
  data () {
    return {
      
      scene: null,
      group: null,
      camera: null,
      pointLight: null,
      ambient: null,
      renderer: null,
      controls: null,
        
      width: 0,
      height: 0,

      options: {
        level: 0.2,
        limit: 10000,
        nodesNumber: 10,
        edgesNumber: 10,
        nodesDistance: 3,
        nodesRadius: 10,
        imgSize: 250,
        randomSize: 50,
        color: 0xff00ff,
        background: true,
        isLightFollowCamera: false,
      },
  
      divisions: 50,

     
    }
  },
  methods: {
    init() {
      
      this.initThree();
      this.initScene();
      this.initCamera();
      this.initLight();
      this.initObject();
      this.initGUI();
      this.render();
      this.addListener();
    },
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
    initScene() {
      this.scene = new THREE.Scene();
    },
    initGUI() {
        var gui = new GUI();
        var folderGeometry = gui.addFolder('Geometry');
        folderGeometry.add(this.options, 'level', 0, 10).onChange(this.updateScene);
        folderGeometry.add(this.options, 'limit', 100, 50000).onChange(this.updateScene);
        folderGeometry.open();
        
    },
    updateScene() {
      let meshs = [];

      this.group.traverse(function(obj) {
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

      
      this.initObject();
    },
    initCamera() {
      // this.camera = new OrthographicCamera(this.width / - 2, this.width / 2, this.height / 2,   this.height / - 2, 0, 10000);
  
      this.camera = new THREE.PerspectiveCamera( 45, this.width/this.height, 1, 10000);
      this.camera.position.set(300, 300, 300);
      this.camera.up.x = 0; 
      this.camera.up.y = 1; 
      this.camera.up.z = 0; 
      this.camera.lookAt({
        x: 0,
        y: 0,
        z: 0
      });
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true; 
      this.controls.dampingFactor = 0.05;
      this.controls.screenSpacePanning = false;
  
    },    
    initLight() {
      this.pointLight = new THREE.PointLight(0xffffff);

      this.pointLight.position.set(0, 2000, 0);
      this.ambient = new THREE.AmbientLight(0x444444);
      this.scene.add(this.pointLight);
      this.scene.add(this.ambient);
    },
    loadFile(name) { // name为文件所在位置
      let xhr = new XMLHttpRequest();
      var okStatus = document.location.protocol === "file:" ? 0 : 200;
      xhr.open('GET', name, false);
      xhr.overrideMimeType("text/html;charset=utf-8");
      xhr.send(null);
      return xhr.status === okStatus ? xhr.responseText : null;
    },

   
    getNumIslands(grid) {
        var m = grid.length; //500
        var n = grid[0].length; //631
        var res = 0;
        var a = JSON.parse(JSON.stringify(grid)); 
        var b = [];
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {

              if(a[i][j][2] != 0) {
                var count = 0;
                var group = [];
                res++;
                a[i][j][2] = 0;
                b.push([i, j]);
                group.push([i, j]);

                while(b.length > 0) {
                  var row = b[0][0];
                  var col = b[0][1];
                  b.shift();
                  count++;
                  if(row - 1 >= 0 && a[row - 1][col][2] != 0) {
                    b.push([row - 1, col]);
                    group.push([row - 1, col]);
                    a[row - 1][col][2] = 0;
                  }
                  if(row + 1 < m && a[row + 1][col][2] != 0) {
                    b.push([row + 1, col]);
                    group.push([row + 1, col]);
                    a[row + 1][col][2] = 0;

                  }
                  if(col - 1 >= 0 && a[row][col - 1][2] != 0) {
                    b.push([row, col - 1]);
                    group.push([row, col - 1]);
                    a[row][col - 1][2] = 0;
                  }
                  if(col + 1 < n-1 && a[row][col + 1][2] != 0) {
                    b.push([row, col + 1]);
                    group.push([row, col + 1]);
                    a[row][col + 1][2] = 0;
                  }
                }
                if(count < this.options.limit) {
                  for(let k = 0; k < group.length; k++) {
                    grid[group[k][0]][group[k][1]][2] = 0;
                  }
                }
              }
            }
        }

        return res;
    },
    initObject() {
      

      var v = [];
      var vertices = [];
      let data = this.loadFile('./static/Thickness.txt').replace(/\s+/ig," ").split(" ");
      data.forEach(e => {
        v.push(parseFloat(e));
      })
      for(let i = 0; i < data.length; i += 3) {
        vertices.push([v[i], v[i + 1], v[i + 2]]);
      }
      for(let i = 0; i < vertices.length; i++) {
        vertices[i][0] = vertices[i][0] - 750;
        vertices[i][1] = vertices[i][1] - 1750;
        vertices[i][2] = vertices[i][2] * 10;
      }
      var trace = [];
      var col = [];

      for(let i = 0, j = 0; i < vertices.length; i++) {
        if(vertices[i][0] == j) {
          col.push(vertices[i]);
          continue;
        }
        trace.push(col);
        col = []
        j++;
      }
      var m = trace.length; //500
      var n = trace[0].length; //631
      for(let i = 0; i < m; i++) {
        for(let j = 0; j < n; j++) {
          if(i == 0 || j == 0 || i == m - 1 || j == n - 1|| trace[i][j][2] <= this.options.level) {
            trace[i][j][2] = 0;
          }
        }
      }
      
      this.getNumIslands(trace);

      var vBuff = [];
      var vBuff2 = [];
      var colors = [];

      for(let i = 0; i < trace.length - 1; i++) {
        var trace1 = trace[i];
        var trace2 = trace[i + 1];
        for(let j = 0; j < trace1.length - 1; j++) {
          var p1 = trace1[j];
          var p2 = trace2[j];
          var p3 = trace1[j + 1];
          var p4 = trace2[j + 1];
          if(i !=0 && j != 0 && i != m - 1 && j != n - 1 && trace[i][j][2] <= this.options.level) {
            continue;
          }
          vBuff.push(
            p1[0], p1[1], p1[2], 
            p3[0], p3[1], p3[2], 
            p4[0], p4[1], p4[2], 
            p1[0], p1[1], p1[2], 
            p2[0], p2[1], p2[2], 
            p4[0], p4[1], p4[2]);
          vBuff2.push(
            p1[0], p1[1], - p1[2], 
            p3[0], p3[1], - p3[2], 
            p4[0], p4[1], - p4[2], 
            p1[0], p1[1], - p1[2], 
            p2[0], p2[1], - p2[2], 
            p4[0], p4[1], - p4[2]);
          colors.push(
            1, 1 ,p1[2], 
            1, 1 ,p3[2], 
            1, 1 ,p4[2], 
            1, 1 ,p1[2], 
            1, 1 ,p2[2], 
            1, 1 ,p4[2]);
        }
      }
      
      this.group = new THREE.Group();
      

      var geometry = new THREE.BufferGeometry();
      var vertices = new Float32Array(vBuff);
      var attribue = new THREE.BufferAttribute(vertices, 3); 
      var color = new Float32Array(colors);

      geometry.attributes.color = new THREE.BufferAttribute(color, 3);

      geometry.attributes.position = attribue;
      geometry.computeVertexNormals();
      var material = new THREE.MeshLambertMaterial({
        side: THREE.DoubleSide,
        vertexColors: true,
      });
      var mesh = new THREE.Mesh(geometry, material); 
      mesh.rotation.x = Math.PI / 2;

      this.group.add(mesh);


      var geometry2 = new THREE.BufferGeometry();
      var vertices2 = new Float32Array(vBuff2);

      
      geometry2.attributes.color = new THREE.BufferAttribute(color, 3);

      var attribue = new THREE.BufferAttribute(vertices2, 3); 
      geometry2.attributes.position = attribue;
      geometry2.computeVertexNormals();

      
      var mesh2 = new THREE.Mesh(geometry2, material); 
      mesh2.rotation.x = Math.PI / 2;

      this.group.add(mesh2);

      
      this.initAxis();
      
      this.scene.add(this.group);




      var lut = new Lut();
      var params = {
         colorMap: 'rainbow',
      };

      lut.setColorMap( params.colorMap );

      lut.setMax(30);
      lut.setMin(0);
      geometry = mesh.geometry;
      geometry2 = mesh2.geometry;
      colors = geometry.attributes.color;

      for ( var i = 0; i < color.length/3; i ++ ) {
        var colorValue = color[i*3 + 2];
        var newcolor = lut.getColor(colorValue);
        colors.setXYZ( i, newcolor.r, newcolor.g, newcolor.b );
      }
    },
   
    render() {
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
      this.controls.update();
      // this.axisUpdate();
      requestAnimationFrame(this.render);
    },
    initAxis() {
      //中心定位坐标轴
      let axisHelper = new THREE.AxesHelper(this.options.imgSize);
      this.group.add(axisHelper);
      return;
      var groupAxis = new THREE.Group();
      groupAxis.name = 'Axis';
      var groupxz = new THREE.Group();
      groupxz.name = 'planeXZ';
      var groupxy = new THREE.Group();
      groupxy.name = 'planeXY';
      var groupyz = new THREE.Group();
      groupyz.name = 'planeYZ';
      var groupTextX = new THREE.Group();
      groupTextX .name = 'textX';
      var groupTextY = new THREE.Group();
      groupTextY .name = 'textY';
      var groupTextZ = new THREE.Group();
      groupTextZ .name = 'textZ';
      var strX = new THREE.Group();
      strX .name = 'strX';
      var strY = new THREE.Group();
      strY.name = 'strY';
      var strZ = new THREE.Group();
      strZ.name = 'strZ';
      var material = new THREE.LineBasicMaterial({
            color: 0xffffff,
        });
      //x-z面
      var geometryXZ = new THREE.Geometry();
      geometryXZ.vertices.push(new THREE.Vector3(-this.options.imgSize, 0, 0));
      geometryXZ.vertices.push(new THREE.Vector3(this.options.imgSize, 0, 0));
      for(let i = 0; i <= this.options.imgSize * 2 / this.divisions; i++) {
          var linex = new THREE.Line(geometryXZ, material);
          linex.position.z = i * this.divisions - this.options.imgSize;
          var liney = new THREE.Line(geometryXZ, material);
          liney.position.x = i * this.divisions - this.options.imgSize;
          liney.rotation.y = Math.PI * 3/ 2;
          groupxz.add(linex);
          groupxz.add(liney);
      }
      groupAxis.add(groupxz);
    
      //x-y面
    
      var geometryXY = new THREE.Geometry();
      geometryXY.vertices.push(new THREE.Vector3(-this.options.imgSize, 0, 0));
      geometryXY.vertices.push(new THREE.Vector3(this.options.imgSize, 0, 0));
      for(let i = 0; i <= this.options.imgSize * 2 / this.divisions; i++) {
        var linex = new THREE.Line(geometryXY, material);
        linex.position.y = i * this.divisions - this.options.imgSize;
        var liney = new THREE.Line(geometryXY, material);
        liney.position.x = i * this.divisions - this.options.imgSize;
        liney.rotation.z = Math.PI * 3/ 2;
        groupxy.add(linex);
         groupxy.add(liney);
      }
      groupAxis.add(groupxy);
        //y-z面
    
      var geometryYZ = new THREE.Geometry();
      geometryYZ.vertices.push(new THREE.Vector3(0, 0, -this.options.imgSize));
      geometryYZ.vertices.push(new THREE.Vector3(0, 0, this.options.imgSize));
      for(let i = 0; i <= this.options.imgSize * 2 / this.divisions; i++) {
          var linex = new THREE.Line(geometryYZ, material);
          linex.position.y = i * this.divisions - this.options.imgSize;
          groupyz.add(linex);
          var liney = new THREE.Line(geometryYZ, material);
          liney.position.z = i * this.divisions - this.options.imgSize;
          liney.rotation.x = Math.PI * 3/ 2;
          groupyz.add(liney);
      }
      groupAxis.add(groupyz);
    
      // 网格坐标数字刻度
      for(let i = 0; i <= this.options.imgSize * 2 / this.divisions; i++) {
        var textx = this.makeTextSprite(Math.ceil(i * this.divisions - this.options.imgSize), { 
            fontsize: 18, 
            fontface: "Georgia", 
        });
      
        var texty = this.makeTextSprite(Math.ceil(i * this.divisions - this.options.imgSize), { 
            fontsize: 18,
            fontface: "Georgia", 
        });
        var textz = this.makeTextSprite(Math.ceil(i * this.divisions - this.options.imgSize), { 
            fontsize: 18, 
            fontface: "Georgia", 
        });
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
      var str = this.makeTextSprite('X', { 
        fontsize: 36,
        fontface: "Georgia", 
      });
      str.center = new THREE.Vector2(0, 1);
      str.position.set(0, 0, 30);
      strX.add(str);
        
      var str = this.makeTextSprite('Y', { 
        fontsize: 36,
        fontface: "Georgia", 
      });
      str.center = new THREE.Vector2(0, 1);
      str.position.set(0, 0, 0);
      strY.add(str);
      
      
      var str = this.makeTextSprite('Z', { 
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
      coverx.name = 'coverX';
      var coverLine = new THREE.Geometry();
      coverLine.vertices.push(new THREE.Vector3(0, 0, 0));
      coverLine.vertices.push(new THREE.Vector3(0, 0, 0));
      
      var line = new THREE.Line(coverLine, material);
      coverx.add(line);
      
      var covery = new THREE.Group();
      covery.name = 'coverY';
      covery.add(line.clone());
      var coverz = new THREE.Group();
      coverz.name = 'coverZ';
      coverz.add(line.clone());
      groupAxis.add(coverx);
      groupAxis.add(covery);
      groupAxis.add(coverz);
      this.group.add(groupAxis);
      
    },
    makeTextSprite(message, parameters) {
      if ( parameters === undefined ) parameters = {};
      
      var fontface = parameters.hasOwnProperty("fontface") ? 
          parameters["fontface"] : "Arial";
      
      var fontsize = parameters.hasOwnProperty("fontsize") ? 
          parameters["fontsize"] : 18;

      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      context.font = "Bold " + fontsize + "px " + fontface;
      
      var metrics = context.measureText(message);
   
      context.fillStyle = "rgba(255, 255, 255, 1.0)";
      context.fillText(message, 0, fontsize);
      
      var texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
    
      var spriteMaterial = new THREE.SpriteMaterial({ 
              map: texture, 
              sizeAttenuation: true
          });
      var sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(100, 50, 1.0);
      return sprite;  
    },
    axisUpdate() {
      let planeXZ, planeXY, planeYZ, 
      textX, textY, textZ,
      strX, strY, strZ,
      coverX, coverY, coverZ;
      
      this.group.children.forEach(function(e){
        if(e.name == 'Axis') {
          for(let i = 0; i < e.children.length; i++){
            if(e.children[i].name == 'planeXZ') {
              planeXZ = e.children[i];
            } else if(e.children[i].name == 'planeXY') {
              planeXY = e.children[i];
            } else if(e.children[i].name == 'planeYZ') {
              planeYZ = e.children[i];
            } else if(e.children[i].name == 'textX') {
              textX = e.children[i];
            } else if(e.children[i].name == 'textY') {
              textY = e.children[i];
            } else if(e.children[i].name == 'textZ') {
              textZ = e.children[i];
            } else if(e.children[i].name == 'strX') {
              strX = e.children[i];
            } else if(e.children[i].name == 'strY') {
              strY = e.children[i];
            } else if(e.children[i].name == 'strZ') {
              strZ = e.children[i];
            } else if(e.children[i].name == 'coverX') {
              coverX = e.children[i];
            } else if(e.children[i].name == 'coverY') {
              coverY = e.children[i];
            } else if(e.children[i].name == 'coverZ') {
              coverZ = e.children[i];
            }
          }
        }
      })
      
      if(this.camera.rotation._z > 0 && this.camera.rotation._z < Math.PI/2){
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
        
      } else if(this.camera.rotation._z > Math.PI/2 && this.camera.rotation._z < Math.PI){
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
        
      } else if(this.camera.rotation._z > -Math.PI && this.camera.rotation._z < -Math.PI/2){
        planeXY.position.z = this.options.imgSize;
        planeYZ.position.x = this.options.imgSize;
        
        textX.position.z = -this.options.imgSize - 5;
        textX.position.y = -this.options.imgSize;
        strX.position.z = -this.options.imgSize - 60;
        strX.position.y = -this.options.imgSize;
        
        textY.position.x = - this.options.imgSize - 3;
        textY.position.y = -this.options.imgSize;
        strZ.position.x = -this.options.imgSize - 30;
        strZ.position.y = -this.options.imgSize;
        
        textZ.position.z = this.options.imgSize;
        textZ.position.x = -this.options.imgSize - 10;
        strY.position.z = this.options.imgSize;
        strY.position.x = -this.options.imgSize - 30;
  
        
        
      } else if(this.camera.rotation._z > -Math.PI/2 && this.camera.rotation._z < 0){
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
    addListener() {
      window.addEventListener( 'resize', this.onWindowResize, false );
    },
    onWindowResize(e) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight );
    },
  },
  mounted() {
    this.init();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  #description {
    position: absolute;
    padding: 5px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 4px;
    font: 14px/21px "Microsoft YaHei";
    white-space: nowrap;
    z-index: 9999;
  }
</style>
