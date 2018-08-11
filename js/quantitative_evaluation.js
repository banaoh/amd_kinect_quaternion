/**
 * Created by daiha_000 on 2015/10/29.
 */

// global variable
var mesh; //モデルデータ
var webglcanvas = document.getElementById("webgl-container");

var webglcamera;
var light;
var loader;
var webglwidth = 640;
var webglheight = 480;
var webGLRenderer;
var spotlight;

var count = 0;
var current_frame = 0;
var end_frame = 0;

var model_num = 3;
var num_of_joints = 16;
var filename = new Array(model_num);


var motion_data = new Array(model_num);
var mesh = new Array(model_num);
var joint_points = new Array(model_num);
var sum_square_error_Input_Correct = 0;
var sum_square_error_Predicted_Correct = 0;

// preparing vivi[] and vuvu[]
var vivi = [];
var vuvu = [];

function boneinvert() {
  var Xaxis = new THREE.Vector3(1, 0, 0);
  var Yaxis = new THREE.Vector3(0, 1, 0);
  var Zaxis = new THREE.Vector3(0, 0, 1);
  var angle = -Math.PI / 2;

  for (var i = 0; i < 20; i++) {
    vivi[i] = new THREE.Quaternion();
    vuvu[i] = new THREE.Quaternion();
  }

  vivi[0].setFromAxisAngle(Yaxis, Math.PI);
  vivi[4].setFromAxisAngle(Zaxis, -angle);
  vivi[8].setFromAxisAngle(Zaxis, angle);
  vivi[12].setFromAxisAngle(Zaxis, -angle);
  vivi[13].setFromAxisAngle(Zaxis, -angle);
  vivi[15].setFromAxisAngle(Xaxis, -angle);
  vivi[16].setFromAxisAngle(Zaxis, angle);
  vivi[17].setFromAxisAngle(Zaxis, angle);
  vivi[19].setFromAxisAngle(Xaxis, -angle);
  vuvu[0].setFromAxisAngle(Yaxis, Math.PI);
  vuvu[5].setFromAxisAngle(Zaxis, angle);
  vuvu[6].setFromAxisAngle(Zaxis, angle);
  vuvu[7].setFromAxisAngle(Zaxis, angle);
  vuvu[9].setFromAxisAngle(Zaxis, -angle);
  vuvu[10].setFromAxisAngle(Zaxis, -angle);
  vuvu[11].setFromAxisAngle(Zaxis, -angle);
  vuvu[13].setFromAxisAngle(Zaxis, angle);
  vuvu[14].setFromAxisAngle(Zaxis, angle * 2);
  vuvu[15].setFromAxisAngle(Zaxis, angle * 2);
  vuvu[17].setFromAxisAngle(Zaxis, -angle);
  vuvu[18].setFromAxisAngle(Zaxis, -angle * 2);
  vuvu[19].setFromAxisAngle(Zaxis, -angle * 2);
}

boneinvert();


// webgl settings
//renderer
webglrenderer = new THREE.WebGLRenderer({ antialias: true });
webglrenderer.setClearColor(new THREE.Color(0xFFFFFF, 0));
webglrenderer.setSize(webglwidth, webglheight);
webglrenderer.shadowMapEnabled = true;
webglrenderer.shadowMapType = THREE.PCFSoftShadowMap;
webglcanvas.appendChild(webglrenderer.domElement);

//scene
scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xfff4e5, 0.00003);

//helper
scene.add(new THREE.AxisHelper(30));

//camera
webglcamera = new THREE.PerspectiveCamera(40, webglwidth / webglheight, 1, 12000);
webglcamera.position.set(0, 0, 10);
webglcamera.lookAt(new THREE.Vector3(0, 30, 0));


// トラックボールの作成
trackball = new THREE.TrackballControls(webglcamera);
// 回転無効化と回転速度の設定
trackball.noRotate = false; // false:有効 true:無効
trackball.rotateSpeed = 5.0;
// ズーム無効化とズーム速度の設定
trackball.noZoom = false; // false:有効 true:無効
trackball.zoomSpeed = 1.0;
// パン無効化とパン速度の設定
trackball.noPan = false; // false:有効 true:無効
trackball.panSpeed = 1.0;
// スタティックムーブの有効化
trackball.staticMoving = true; // true:スタティックムーブ false:ダイナミックムーブ
// ダイナミックムーブ時の減衰定数
trackball.dynamicDampingFactor = 0.3;


//light
var spotlight = new Array(3);
for (var i = 0; i < 3; i++) {
  spotlight[i] = new THREE.SpotLight(0xffffff);
  spotlight[i].angle = Math.PI / 3;
  spotlight[i].castShadow = true;
  spotlight[i].shadowMapWidth = 2048;
  spotlight[i].shadowMapHeight = 2048;
  spotlight[i].shadowBias = 0.0001;
  spotlight[i].shadowDarkness = 0.8;
  spotlight[i].shadowCameraNear = 10;
  spotlight[i].shadowCameraFar = 1000;
  spotlight[i].shadowCameraFov = 90;
  spotlight[i].position.set(i*300-300, 0, 100);
  spotlight[i].intensity = 1.5;
  scene.add(spotlight[i]);
}


// model rendering
loader = new THREE.JSONLoader();
// loader.load("model/50s_politician4v2.js", function(geometry, mats) {
loader.load("model/kinect_banaoh.js", function(geometry, mats) {


  mats.forEach(function(mat) {
    mat.skinning = true;
    //mat.morphTargets = true;
  });


  // filename[0] = "../datas/test_datas/kinect_jerk_test_quaternion.csv";
  // filename[1] = "../datas/test_datas/X_test_kinect_jerk_test_quaternion.csv";
  // filename[2] = "../datas/test_datas/mocap_jerk_test_quaternion.csv";

//====================
  var motion = "zenkutsu";
  var side   = "side";
  // filename[0] = "../datas/raw_datas/experiment/dataset/predicts/ki_crossing_arms_back.csv";
  // filename[1] = "../../../../Share";
  filename[0] = "../datas/experiments/X_test_ki_"+ motion +"_"+ side +"_experiment_normalized.csv";
  // filename[0] = "../datas/experiments/only_datas/X_test_ki_"+ motion +"_"+ side +"_experiment_only_7degree_normalized.csv";
  // filename[0] = "../datas/raw_datas/experiment/dataset/predicts/ki_"+ motion +"_"+ side +".csv";
  filename[1] = "../datas/experiments/4s_datas/X_test_ki_"+ motion +"_"+ side +"_experiment_only_7degree_2nd_3rd_normalized.csv";
  filename[2] = "../datas/raw_datas/experiment/dataset/predicts/mo_"+ motion +"_"+ side +".csv";

  // filename[1] = "../datas/experiments/X_test_ki_" + motion + "_" + side + "_experiment_moving_averaged_using_spine_qua_3contexts.csv";

  // filename[0] = "../datas/experiments/X_test_ki_" + motion + "_" + side + "_experiment_moving_averaged_using_spine_qua_3contexts.csv";
  // filename[1] = "../datas/experiments/X_test_ki_" + motion + "_" + side + "_experiment_moving_averaged_using_all_bone_joints_qua_3contexts.csv";
  // filename[2] = "../datas/experiments/X_test_ki_" + motion + "_" + side + "_experiment_only_3degree_moving_averaged_using_spine_qua_3contexts.csv";
  // filename[3] = "../datas/experiments/X_test_ki_" + motion + "_" + side + "_experiment_only_3degree_moving_averaged_using_all_bone_joints_qua_3contexts.csv";
  // filename[4] = "../datas/experiments/X_test_ki_" + motion + "_" + side + "_experiment_nrand_moving_averaged_using_spine_qua_3contexts.csv";
  // filename[5] = "../datas/experiments/X_test_ki_" + motion + "_" + side + "_experiment_nrand_moving_averaged_using_all_bone_joints_qua_3contexts.csv";

//====================

  // filename[0] = "../datas/experiments/X_test_ki_crossing_arms_front_experiment_moving_averaged_21contexts.csv";
  // filename[1] = "../datas/experiments/X_test_ki_crossing_arms_front_experiment_nrand_moving_averaged_21contexts.csv";
  // filename[2] = "../datas/raw_datas/experiment/dataset/predicts/mo_crossing_arms_front.csv";


  // (2) motionデータの読み込み
  for (var i = 0; i < motion_data.length; i++) {
    motion_data[i] = load_csv(filename[i]);
  }
  
  kinect_data = load_csv(filename[0]);
  test_data = load_csv(filename[2]);

  // (3) frameの長さを合わせる
  var min_frame = motion_data[0].length;
  for (var i = 1; i < motion_data.length; i++) {
    if(min_frame > motion_data[i].length){
      min_frame = motion_data[i].length;
    }
  }
  for (var i = 0; i < motion_data.length; i++) {
    motion_data[i] = motion_data[i].slice(0, min_frame);
  }
  end_frame = min_frame - 10;
  // end_frame = 100;

  // (4) meshの準備
  // mesh[0, 1, 2] ... [ original(kinect), predicted, correct(mocap) ]
  for (var i = 0; i < mesh.length; i++) {
    mesh[i] = new THREE.SkinnedMesh(geometry, new THREE.MeshFaceMaterial(mats));
    // mesh[i].skeleton.bones[0].position.set(i*15-20, 0, 0);
    mesh[i].skeleton.bones[0].position.set(0, 0, 0);
    // mesh[i].scale.set(5.8, 5.8, 5.8);
    mesh[i].scale.set(1, 1, 1);
    mesh[i].castShadow = true;
    scene.add(mesh[i]);
  }


  for (var i = 0; i < model_num; i++) {
    var joints = [];
    for (var j = 0; j < 25; j++) {
      var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
      var geometry = new THREE.CircleGeometry( 0.04, 8 );
      joints.push(new THREE.Mesh( geometry, material ));
    }
    joint_points[i] = joints;
  }

  for (var i = 0; i < model_num; i++) {
    for (var j = 0; j < 25; j++) {
      scene.add(joint_points[i][j]);
    }
  }



  
  render();
});

// csvファイルを読み込み、配列にして返す
// return motion[frame][ 25関節 x quaternion(x, y, z, w) ]
function load_csv(filename){
  var csvData = new Array();
  var data = new XMLHttpRequest();
  data.open("GET", filename, false); //true:非同期,false:同期
  data.send(null);

  var LF = String.fromCharCode(10); //改行ｺｰﾄﾞ
  var lines = data.responseText.split(LF);
  for (var i = 0; i < lines.length;++i) {
    var cells = lines[i].split(",");
    if( cells.length != 1 ) {
      csvData.push(cells);
    }
  }
  return csvData;
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// kinect -> three の変換メソッド
function convert_kinect_to_three( quaternionArray, mesh ) {

  var norot = new THREE.Quaternion().set(0,0,0,0); // SL
  var erot = new THREE.Quaternion().set(0,0,0,1); // SL
  var  yrot = new THREE.Quaternion().set(0,0.707,0,0.707);
  var _yrot = new THREE.Quaternion().set(0,-0.707,0,0.707);

  // // (1) 25関節分のquaternionに分け、文字列をfloatに変換する
  var kinectAbs_rotq = new Array(25);
  var tmp = new Array(25);
  for (var i = 0; i < quaternionArray.length/4; i++) {
    kinectAbs_rotq[i] = new THREE.Quaternion().set( parseFloat(quaternionArray[i*4]),
                                                    parseFloat(quaternionArray[i*4+1]),
                                                    parseFloat(quaternionArray[i*4+2]),
                                                    parseFloat(quaternionArray[i*4+3]));
  }
  // 以下、kinect -> three

  // 1. kinect-abs -> three-abs: 座標系変換
  // 全部一緒
  var kinectAbsToThreeAbs_rotq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ"));



  // 配列の定義
  var three_rotq = new Array(25);
  for (var i = 0; i < three_rotq.length; i++) {
    if (!kinectAbs_rotq[i]) continue;
    var tmp_rot = new THREE.Vector3( kinectAbs_rotq[i].x, kinectAbs_rotq[i].y, kinectAbs_rotq[i].z );
    tmp_rot.applyQuaternion( kinectAbsToThreeAbs_rotq );
    three_rotq[i] = new THREE.Quaternion( tmp_rot.x, tmp_rot.y, tmp_rot.z, kinectAbs_rotq[i].w );
  }

  // 2. three_obj -> kinect-obj: オブジェクト変換 e.g. SL: (1,0,0) -> (0,1,0)
  //     &  y軸回り180度を除去
  var threeObjToKinectObj = new Array(25);
  threeObjToKinectObj[0] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ")); // SpineBase
  threeObjToKinectObj[1] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ")); // SpineMid
  threeObjToKinectObj[20] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ")); // SpineShoulder (as ShoulderCenter)
  threeObjToKinectObj[2] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ")); // Neck
  threeObjToKinectObj[3] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, "XYZ")); // Face (as Head)

  threeObjToKinectObj[4] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, Math.PI / 2, "XYZ")); // ShoulderLeft --- 0が入るべき
  threeObjToKinectObj[5] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI + Math.PI / 2, Math.PI / 2, "XYZ")); // ElbowLeft
  threeObjToKinectObj[6] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, Math.PI / 2, "XYZ")); // WristLeft
  threeObjToKinectObj[7] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, Math.PI / 2, "XYZ")); // WristLeft


  threeObjToKinectObj[8] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // ShoulderRight --- 0が入るべき
  threeObjToKinectObj[9] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI - Math.PI / 2, -Math.PI / 2, "XYZ")); // ElbowRight
  threeObjToKinectObj[10] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // WristRight
  threeObjToKinectObj[11] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // WristRight


  threeObjToKinectObj[12] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI, Math.PI / 2, "XYZ")); // HipLeft --- 0が入るべき
  threeObjToKinectObj[13] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI + Math.PI / 2, Math.PI, "XYZ")); // KneeLeft
  threeObjToKinectObj[14] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, Math.PI, "XYZ")); // AnkleLeft
  threeObjToKinectObj[15] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, Math.PI, "XYZ")); // AnkleLeft

  threeObjToKinectObj[16] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // HipRight ---- 0が入るべき
  threeObjToKinectObj[17] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI - Math.PI / 2, -Math.PI, "XYZ")); // KneeRight
  threeObjToKinectObj[18] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, -Math.PI, "XYZ")); // AnkleRight
  threeObjToKinectObj[19] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, -Math.PI, "XYZ")); // AnkleRight

  var three_rotq2 = new Array(25);
  for (var i = 0; i < three_rotq2.length; i++) {
    if (!kinectAbs_rotq[i]) continue;
    if (!threeObjToKinectObj[i]) continue;
    three_rotq2[i] = new THREE.Quaternion().multiplyQuaternions(three_rotq[i], threeObjToKinectObj[i]);
  }

  // 3. three_abs -> three_rel: オブジェクト変換
  var three_rotq3 = new Array(25);
  three_rotq3[0] = new THREE.Quaternion().multiplyQuaternions(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, "XYZ")), three_rotq2[0]);
  three_rotq3[1] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[0].inverse(), three_rotq2[1]); // model-SpineBase
  three_rotq3[2] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[1].inverse(), three_rotq2[20]); //
  three_rotq3[3] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[20].inverse(), three_rotq2[2]);
  if (three_rotq3[3]) {
    // face の座標はないときがある
    three_rotq3[4] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[2].inverse(), three_rotq2[3]); // head
  }
  // three_rotq2[20].inverse();
  three_rotq3[5] = erot; // SL --- 0が入るべき
  // three_rotq3[5] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[20].inverse(), three_rotq2[4]); // SL --- 0が入るべき
  three_rotq3[6] = new THREE.Quaternion().multiplyQuaternions(erot, three_rotq2[5]); // EL
  three_rotq3[7] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[5].inverse(), three_rotq2[6]); // WL
  three_rotq3[8] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[6].inverse(), three_rotq2[7]); // WL
  

  // three_rotq2[20].inverse();
  // shoulderは回らないので( 0, 0, 0, 0 )
  three_rotq3[11] = erot; // SR --- 0が入るべき
  // three_rotq3[11] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[20].inverse(), three_rotq2[8]); // SR --- 0が入るべき
  three_rotq3[12] = new THREE.Quaternion().multiplyQuaternions(erot, three_rotq2[9]); // ER
  three_rotq3[13] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[9].inverse(), three_rotq2[10]); // WR
  three_rotq3[14] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[10].inverse(), three_rotq2[11]); // WR
  
  three_rotq3[17] = erot; // HL --- 0が入るべき
  three_rotq3[18] = new THREE.Quaternion().multiplyQuaternions( erot , three_rotq2[13] ); // KL
  three_rotq3[19] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[13].inverse(), three_rotq2[14] ); // AL
  three_rotq3[20] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[14].inverse(), three_rotq2[15] ); // AL

  three_rotq3[21] = erot; // HR --- 0が入るべき
  three_rotq3[22] = new THREE.Quaternion().multiplyQuaternions( erot, three_rotq2[17] ); // KR
  three_rotq3[23] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[17].inverse(), three_rotq2[18] ); // AR
  three_rotq3[24] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[18].inverse(), three_rotq2[19] ); // AR

  for (var j = 0; j < 25; j++) {
      mesh.skeleton.bones[j].quaternion.copy( erot );
  }

  mesh.skeleton.bones[0].quaternion.copy( three_rotq3[0] );
  mesh.skeleton.bones[1].quaternion.copy( three_rotq3[1] );
  mesh.skeleton.bones[2].quaternion.copy( three_rotq3[2] );
  mesh.skeleton.bones[3].quaternion.copy( three_rotq3[3] );
  if(three_rotq3[4]){
    mesh.skeleton.bones[4].quaternion.copy( three_rotq3[4] );
  }

  mesh.skeleton.bones[5].quaternion.copy( three_rotq3[5] ); // 0であるべき
  mesh.skeleton.bones[6].quaternion.copy( three_rotq3[6] ); // 肩の回転が入っている
  mesh.skeleton.bones[7].quaternion.copy( three_rotq3[7] ); // 肘の回転が入っているべき
  // 手首の回転を入れる

  mesh.skeleton.bones[11].quaternion.copy( three_rotq3[11] ); // 0であるべき
  mesh.skeleton.bones[12].quaternion.copy( three_rotq3[12] );
  mesh.skeleton.bones[13].quaternion.copy( three_rotq3[13] );
  // 手首の回転を入れる

  mesh.skeleton.bones[17].quaternion.copy( three_rotq3[17] ); // 0であるべき
  mesh.skeleton.bones[18].quaternion.copy( three_rotq3[18] );
  mesh.skeleton.bones[19].quaternion.copy( three_rotq3[19] );
  mesh.skeleton.bones[20].quaternion.copy( three_rotq3[20] );

  mesh.skeleton.bones[21].quaternion.copy( three_rotq3[21] ); // 0であるべき
  mesh.skeleton.bones[22].quaternion.copy( three_rotq3[22] );
  mesh.skeleton.bones[23].quaternion.copy( three_rotq3[23] );
  mesh.skeleton.bones[24].quaternion.copy( three_rotq3[24] );

  // positionを返す
  var kinect_index_positions = new Array(25);
  var three_index_position = new Array(25);
  for( var i = 0; i < 25; i++ ){
    three_index_position[i] = new THREE.Vector3().setFromMatrixPosition( mesh.skeleton.bones[i].matrixWorld );
  }
  // console.log(three_index_position);
  kinect_index_positions = [ 
    [three_index_position[0].x.toString(), three_index_position[0].y.toString(), three_index_position[0].z.toString()],
    [three_index_position[1].x.toString(), three_index_position[1].y.toString(), three_index_position[1].z.toString()],
    [three_index_position[3].x.toString(), three_index_position[3].y.toString(), three_index_position[3].z.toString()],
    [three_index_position[4].x.toString(), three_index_position[4].y.toString(), three_index_position[4].z.toString()],
    [three_index_position[5].x.toString(), three_index_position[5].y.toString(), three_index_position[5].z.toString()],
    [three_index_position[6].x.toString(), three_index_position[6].y.toString(), three_index_position[6].z.toString()],
    [three_index_position[7].x.toString(), three_index_position[7].y.toString(), three_index_position[7].z.toString()],
    [three_index_position[8].x.toString(), three_index_position[8].y.toString(), three_index_position[8].z.toString()],
    [three_index_position[11].x.toString(), three_index_position[11].y.toString(), three_index_position[11].z.toString()],
    [three_index_position[12].x.toString(), three_index_position[12].y.toString(), three_index_position[12].z.toString()],
    [three_index_position[13].x.toString(), three_index_position[13].y.toString(), three_index_position[13].z.toString()],
    [three_index_position[14].x.toString(), three_index_position[14].y.toString(), three_index_position[14].z.toString()],
    [three_index_position[17].x.toString(), three_index_position[17].y.toString(), three_index_position[17].z.toString()],
    [three_index_position[18].x.toString(), three_index_position[18].y.toString(), three_index_position[18].z.toString()],
    [three_index_position[19].x.toString(), three_index_position[19].y.toString(), three_index_position[19].z.toString()],
    [three_index_position[20].x.toString(), three_index_position[20].y.toString(), three_index_position[20].z.toString()],
    [three_index_position[21].x.toString(), three_index_position[21].y.toString(), three_index_position[21].z.toString()],
    [three_index_position[22].x.toString(), three_index_position[22].y.toString(), three_index_position[22].z.toString()],
    [three_index_position[23].x.toString(), three_index_position[23].y.toString(), three_index_position[23].z.toString()],
    [three_index_position[24].x.toString(), three_index_position[24].y.toString(), three_index_position[24].z.toString()],
    [three_index_position[2].x.toString(), three_index_position[2].y.toString(), three_index_position[2].z.toString()],
    [three_index_position[16].x.toString(), three_index_position[16].y.toString(), three_index_position[16].z.toString()],
    [three_index_position[15].x.toString(), three_index_position[15].y.toString(), three_index_position[15].z.toString()],
    [three_index_position[10].x.toString(), three_index_position[10].y.toString(), three_index_position[10].z.toString()],
    [three_index_position[9].x.toString(), three_index_position[9].y.toString(), three_index_position[9].z.toString()]
  ];

  return kinect_index_positions;
}



function convertEulerToQuaternion(quaArray){

  var frame_array=[];
  for (var i = 0; i < quaArray.length/3; i++) {
    var quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(parseFloat(quaArray[i*3]),
                                                                         parseFloat(quaArray[i*3+1]),
                                                                         parseFloat(quaArray[i*3+2]), 'XYZ' ));
    frame_array.push(quaternion.x);
    frame_array.push(quaternion.y);
    frame_array.push(quaternion.z);
    frame_array.push(quaternion.w);
  }

  return frame_array;
}


function culcRotationAPE_input_to_correct(input_mesh, correct_mesh){
  var sum_square_error = 0;

  for ( var i = 0; i<25; i++ ) {
    // 上半身のみ
    // if( (i != 4) && (i != 9) && (i != 10) && (i != 15) && (i != 16) && (i != 21) && (i != 22) && (i != 23) && (i != 24) && (i != 17) && (i != 18) && (i != 19) && (i != 20) ){
    
    // kinect v1と同じ ( 20 joints )
    // if( (i != 4) && (i != 9) && (i != 10) && (i != 15) && (i != 16)  ){
    // if( (i != 4) && (i != 9) && (i != 10) && (i != 15) && (i != 16) && (i != 21) && (i != 22) && (i != 23) && (i != 24) && (i != 17) && (i != 18) && (i != 19) && (i != 20) ){

    // parkらとの比較（　両手足、頭　）
    if( num_of_joints == 16 ){
      if( (i != 4) && (i != 8) && (i != 9) && (i != 10) && (i != 14) && (i != 15) && (i != 16) && (i != 20) && (i != 24) ){
        var input_mesh_world_position = new THREE.Vector3();
        input_mesh_world_position.setFromMatrixPosition( input_mesh.skeleton.bones[i].matrixWorld );

        var correct_mesh_world_position = new THREE.Vector3();
        correct_mesh_world_position.setFromMatrixPosition( correct_mesh.skeleton.bones[i].matrixWorld );

        var distance_of_position = input_mesh_world_position.distanceTo( correct_mesh_world_position );

        sum_square_error = sum_square_error + distance_of_position;
      }
    } else {
        var input_mesh_world_position = new THREE.Vector3();
        input_mesh_world_position.setFromMatrixPosition( input_mesh.skeleton.bones[i].matrixWorld );

        var correct_mesh_world_position = new THREE.Vector3();
        correct_mesh_world_position.setFromMatrixPosition( correct_mesh.skeleton.bones[i].matrixWorld );

        var distance_of_position = input_mesh_world_position.distanceTo( correct_mesh_world_position );

        sum_square_error = sum_square_error + distance_of_position;
    }
  }

  return sum_square_error;
}


function culcPositionAPE_input_to_correct(input_points, correct_points){
  var sum_square_error = 0;

  for ( var i = 0; i<25; i++ ) {
    if( num_of_joints == 16 ){
      if( (i != 3) && (i != 7) && (i != 11) && (i != 15) && (i != 19)&& (i != 21) && (i != 22) && (i != 23) && (i != 24) ){
        var distance_of_position = input_points[i].position.distanceTo( correct_points[i].position );
        sum_square_error = sum_square_error + distance_of_position;
      }
    } else {
      var distance_of_position = input_points[i].position.distanceTo( correct_points[i].position );
      sum_square_error = sum_square_error + distance_of_position;
    }
  }

  return sum_square_error;
}


function display_position( positionArray, joint_points ) {
  // // (1) 25関節分のquaternionに分け、文字列をfloatに変換する
  var bones_position = new Array(25);
  for (var i = 0; i < positionArray.length/3; i++) {
    joint_points[i].position.set( parseFloat(positionArray[i*3]),
                            parseFloat(positionArray[i*3+1]),
                            parseFloat(positionArray[i*3+2]) );
    // scene.add( joint_points[i] );
    bones_position[i] = [ joint_points[i].position.x.toString(), joint_points[i].position.y.toString(), joint_points[i].position.z.toString(),];
  }
  return bones_position;
}


// input : position[ 25(vector3), ..., 25 (vector3) ],
// return : jerk[ 25(vector3), ..., 25(vector3) ]
function calcJerk(positionArray){
  var velocity = new Array(positionArray.length);
  var acceleration = new Array(positionArray.length);
  var jerk = new Array(positionArray.length);

  for( var i = 0; i < positionArray.length; i++ ){

    // t = 0　では速度ゼロ
    if( i == 0 ){
      for( var j = 0; j < positionArray[i].length; j++ ){
        positionArray[i][j] = new THREE.Vector3( parseFloat(positionArray[i][j][0]), parseFloat(positionArray[i][j][1]), parseFloat(positionArray[i][j][2]) );
      }

      velocity[0] = new Array(25).fill( new THREE.Vector3(0, 0, 0) );
      acceleration[0] = new Array(25).fill( new THREE.Vector3(0, 0, 0) );
      jerk[0] = new Array(25).fill( new THREE.Vector3(0, 0, 0) );
    } else {
      velocity[i] = new Array(25);
      acceleration[i] = new Array(25);
      jerk[i] = new Array(25);

      for( var j = 0; j < positionArray[i].length; j++ ){
        if( num_of_joints == 16 ){
          if( (j != 3) && (j != 7) && (j != 11) && (j != 15) && (j != 19)&& (j != 21) && (j != 22) && (j != 23) && (j != 24) ){
            positionArray[i][j] = new THREE.Vector3( parseFloat(positionArray[i][j][0]), parseFloat(positionArray[i][j][1]), parseFloat(positionArray[i][j][2]) );
            // joint[j] の 速度
            velocity[i][j] = new THREE.Vector3().subVectors( positionArray[i][j], positionArray[i-1][j] );
            // velocity[i][j] =  velocity[i][j].divideScalar( 1/30 );
            // console.log( velocity[i][j]. );
            
            acceleration[i][j] = new THREE.Vector3().subVectors( velocity[i][j], velocity[i-1][j] );
            // acceleration[i][j] =  acceleration[i][j].divideScalar( 1/30 );

            jerk[i][j] = new THREE.Vector3().subVectors(acceleration[i][j], acceleration[i-1][j] );
            // jerk[i][j] =  jerk[i][j].divideScalar( 1/30 );
          }
        } else {
          positionArray[i][j] = new THREE.Vector3( parseFloat(positionArray[i][j][0]), parseFloat(positionArray[i][j][1]), parseFloat(positionArray[i][j][2]) );
          // joint[j] の 速度
          velocity[i][j] = new THREE.Vector3().subVectors( positionArray[i][j], positionArray[i-1][j] );
          // velocity[i][j] =  velocity[i][j].divideScalar( 1/30 );
          // console.log( velocity[i][j]. );
          
          acceleration[i][j] = new THREE.Vector3().subVectors( velocity[i][j], velocity[i-1][j] );
          // acceleration[i][j] =  acceleration[i][j].divideScalar( 1/30 );

          jerk[i][j] = new THREE.Vector3().subVectors(acceleration[i][j], acceleration[i-1][j] );
          // jerk[i][j] =  jerk[i][j].divideScalar( 1/30 );
        }
      }
    }
  }
  return jerk;
}

// input : position[ 25(vector3), ..., 25 (vector3) ]
// return : AJE
function culcPositionAJE_input_to_correct( input_jerk, ground_truth_jerk ){
  var average_jerk_error = 0;
  for( var i = 0; i < input_jerk.length; i++ ){
    var sum_jerk = 0;
    for( var j = 0; j < input_jerk[i].length; j++ ){

      if( num_of_joints == 16 ){
        if( (j != 3) && (j != 7) && (j != 11) && (j != 15) && (j != 19)&& (j != 21) && (j != 22) && (j != 23) && (j != 24) ){
          sum_jerk += ground_truth_jerk[i][j].distanceTo(input_jerk[i][j]);
        }
      } else {
        sum_jerk += ground_truth_jerk[i][j].distanceTo(input_jerk[i][j]);
      }

    }
    average_jerk_error += sum_jerk/16;
  }
  return average_jerk_error/input_jerk.length;
}


// ===================================================================================
// ===================================================================================
// ===================================================================================
// ===================================================================================


var mocap_current_frame = 0;


var kinect_skeleton = new Array(end_frame);
var predicted = new Array(end_frame);
var ground_truth = new Array(end_frame);


//render
function render() {

  var converted_motion_array = [];


  // 変換を確認用
  // quaternionでのAPEの計算
  // index ... kinect_joint_index  
  kinect_skeleton[current_frame] = convert_kinect_to_three( motion_data[0][ current_frame ], mesh[0] );
  predicted[current_frame]       = convert_kinect_to_three( motion_data[1][ current_frame ], mesh[1] );
  ground_truth[current_frame]    = convert_kinect_to_three( motion_data[2][ current_frame +10 ], mesh[2] );

  // eulerでのAPEの計算
  // index ... kinect_joint_index  
  // // kinect_skeleton[current_frame] = convert_kinect_to_three( convertEulerToQuaternion(motion_data[0][ current_frame +10 ]), mesh[0] );
  // // predicted[current_frame] = convert_kinect_to_three( convertEulerToQuaternion(motion_data[1][ current_frame ]), mesh[1] );
  // // ground_truth[current_frame] = convert_kinect_to_three( convertEulerToQuaternion(motion_data[2][ current_frame +10 ]), mesh[2] );


  // // positionでの計算
  // kinect_skeleton[current_frame] = display_position( motion_data[0][ current_frame +10 ], joint_points[0] ) ;
  // predicted[current_frame] = display_position( motion_data[1][ current_frame ], joint_points[1] ) ;
  // ground_truth[current_frame] = display_position( motion_data[2][ current_frame +10 ], joint_points[2] ) ;



  callbackId = requestAnimationFrame(render);

  // トラックボールによるカメラのプロパティの更新
  trackball.update();

  // frame数を落とす
  if( current_frame < end_frame-1 ){
    // APEの算出
    // euler, quaternionのAOEを計算するときに必要
    // index ... three_joints
    var square_error_Input_Correct = culcRotationAPE_input_to_correct( mesh[0], mesh[2] );
    var square_error_Predicted_Correct = culcRotationAPE_input_to_correct( mesh[1], mesh[2] );

    // positionのAPEを算出
    // index ... kinect_joints
    // var square_error_Input_Correct = culcPositionAPE_input_to_correct( joint_points[0], joint_points[2] );
    // var square_error_Predicted_Correct = culcPositionAPE_input_to_correct( joint_points[1], joint_points[2] );

    sum_square_error_Input_Correct = sum_square_error_Input_Correct + square_error_Input_Correct;
    sum_square_error_Predicted_Correct = sum_square_error_Predicted_Correct + square_error_Predicted_Correct;

    current_frame++;
    webglrenderer.render(scene, webglcamera);
    // console.log(mesh[0]);
  } else {
    // console.log(kinect_skeleton);

    var kinect_skeleton_jerk = calcJerk(kinect_skeleton);
    var predicted_jerk = calcJerk(predicted);
    var ground_truth_jerk = calcJerk(ground_truth);

    // console.log(kinect_skeleton_jerk);
    // console.log(predicted_jerk);
    // console.log(ground_truth_jerk);

    
    var a = new THREE.Vector3(1,1,1);
    var b = new THREE.Vector3(2,2,2);
    // console.log( new THREE.Vector3().subVectors(-a, b) );
    // console.log(kinect_skeleton_jerk);
    console.log(filename[1]);

    console.log("only_data(APE : %d) is : %f", num_of_joints, (sum_square_error_Input_Correct/end_frame)/16 );
    console.log("4s_datas(APE : %d) is : %f", num_of_joints, (sum_square_error_Predicted_Correct/end_frame)/16 );

    console.log("only_data(AJE : %d) is : %f", num_of_joints, culcPositionAJE_input_to_correct(kinect_skeleton_jerk, ground_truth_jerk));
    console.log("4s_datas(AJE : %d) is : %f", num_of_joints, culcPositionAJE_input_to_correct(predicted_jerk, ground_truth_jerk));
    


    cancelAnimationFrame( callbackId ) ;
  }
}
