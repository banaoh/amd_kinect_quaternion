// About : MeshからAPEを算出する関数
// input.1 : 比較対象のMesh
// input.2 : 比較元のmesh
// output : 平均二乗誤差平方根
function calcRotationAPE_input_to_correct(input_mesh, correct_mesh){
  var sum_square_error = 0;

  for ( var i = 0; i<25; i++ ) {

    // index ... threeに準ずる
    // 関節数 : 16(parkらとの比較) or 25
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


// About : PositionからAPEを算出する関す
// input.1 : 比較対象のPosition
// input.2 : 比較元のPosition
// output : 平均二乗偏差平方根
function calcPositionAPE_input_to_correct(input_points, correct_points){
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



// About : position(world) からjerkを計算する関数
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

          // index ... kinectに準ずる
          if( (j != 3) && (j != 7) && (j != 11) && (j != 15) && (j != 19)&& (j != 21) && (j != 22) && (j != 23) && (j != 24) ){
            positionArray[i][j] = new THREE.Vector3( parseFloat(positionArray[i][j][0]), parseFloat(positionArray[i][j][1]), parseFloat(positionArray[i][j][2]) );
            // joint[j] の 速度
            velocity[i][j] = new THREE.Vector3().subVectors( positionArray[i][j], positionArray[i-1][j] );
            
            acceleration[i][j] = new THREE.Vector3().subVectors( velocity[i][j], velocity[i-1][j] );

            jerk[i][j] = new THREE.Vector3().subVectors(acceleration[i][j], acceleration[i-1][j] );
          }
        } else {
          positionArray[i][j] = new THREE.Vector3( parseFloat(positionArray[i][j][0]), parseFloat(positionArray[i][j][1]), parseFloat(positionArray[i][j][2]) );
          // joint[j] の 速度
          velocity[i][j] = new THREE.Vector3().subVectors( positionArray[i][j], positionArray[i-1][j] );
          
          acceleration[i][j] = new THREE.Vector3().subVectors( velocity[i][j], velocity[i-1][j] );

          jerk[i][j] = new THREE.Vector3().subVectors(acceleration[i][j], acceleration[i-1][j] );
        }
      }
    }
  }
  return jerk;
}

// About : position(world) からjerkを計算する関数
// input : position[ 25(vector3), ..., 25 (vector3) ],
// return : jerk[ 25(vector3), ..., 25(vector3) ]
function calcVelocityAccelerationJerk(positionArray){
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

          // index ... kinectに準ずる
          if( (j != 3) && (j != 7) && (j != 11) && (j != 15) && (j != 19)&& (j != 21) && (j != 22) && (j != 23) && (j != 24) ){
            positionArray[i][j] = new THREE.Vector3( parseFloat(positionArray[i][j][0]), parseFloat(positionArray[i][j][1]), parseFloat(positionArray[i][j][2]) );
            // joint[j] の 速度
            velocity[i][j] = new THREE.Vector3().subVectors( positionArray[i][j], positionArray[i-1][j] );
            
            acceleration[i][j] = new THREE.Vector3().subVectors( velocity[i][j], velocity[i-1][j] );

            jerk[i][j] = new THREE.Vector3().subVectors(acceleration[i][j], acceleration[i-1][j] );
          }
        } else {
          positionArray[i][j] = new THREE.Vector3( parseFloat(positionArray[i][j][0]), parseFloat(positionArray[i][j][1]), parseFloat(positionArray[i][j][2]) );
          // joint[j] の 速度
          velocity[i][j] = new THREE.Vector3().subVectors( positionArray[i][j], positionArray[i-1][j] );
          
          acceleration[i][j] = new THREE.Vector3().subVectors( velocity[i][j], velocity[i-1][j] );

          jerk[i][j] = new THREE.Vector3().subVectors(acceleration[i][j], acceleration[i-1][j] );
        }
      }
    }
  }
  return [velocity, acceleration, jerk];
}


function calcAverageJerk( inputJerkArray ){
  var average_jerk = 0;
  for (var frame = 0; frame < end_frame; frame++) {
    for (var bone_index = 0; bone_index < 25;  bone_index++) {
      if( (bone_index != 3) && (bone_index != 7) && (bone_index != 11) && (bone_index != 15) && (bone_index != 19)&& (bone_index != 21) && (bone_index != 22) && (bone_index != 23) && (bone_index != 24) ){
        average_jerk += Math.sqrt( Math.pow(inputJerkArray[frame][bone_index].x, 2) + Math.pow(inputJerkArray[frame][bone_index].y, 2) + Math.pow(inputJerkArray[frame][bone_index].z, 2) );
      }
    }
  }
  return average_jerk/end_frame;
}



// About : jerkからAJEを算出する関数
// input : jerk[ 25(vector3), ..., 25 (vector3) ]
// return : AJE
function calcPositionAJE_input_to_correct( input_jerk, ground_truth_jerk ){
  var average_jerk_error = 0;
  for( var i = 0; i < input_jerk.length; i++ ){
    var sum_jerk = 0;
    for( var j = 0; j < input_jerk[i].length; j++ ){

      // 関節数 : 16 or 25
      if( num_of_joints == 16 ){
        if( (j != 3) && (j != 7) && (j != 11) && (j != 15) && (j != 19)&& (j != 21) && (j != 22) && (j != 23) && (j != 24) ){
          sum_jerk += ground_truth_jerk[i][j].distanceTo(input_jerk[i][j]);
        }
      } else {
        sum_jerk += ground_truth_jerk[i][j].distanceTo(input_jerk[i][j]);
      }

    }
    average_jerk_error += sum_jerk/25;
  }
  return average_jerk_error/input_jerk.length;
}

function calcPositionAVE_input_to_correct( input_jerk, ground_truth_jerk ){
  var average_jerk_error = 0;
  for( var i = 0; i < input_jerk.length; i++ ){
    var sum_jerk = 0;
    for( var j = 0; j < input_jerk[i].length; j++ ){

      // 関節数 : 16 or 25
      if( num_of_joints == 16 ){
        if( (j != 3) && (j != 7) && (j != 11) && (j != 15) && (j != 19)&& (j != 21) && (j != 22) && (j != 23) && (j != 24) ){
          sum_jerk += ground_truth_jerk[i][j].distanceTo(input_jerk[i][j]);
        }
      } else {
        sum_jerk += ground_truth_jerk[i][j].distanceTo(input_jerk[i][j]);
      }

    }
    average_jerk_error += sum_jerk/25;
  }
  return average_jerk_error/input_jerk.length;
}

function calcPositionAAE_input_to_correct( input_jerk, ground_truth_jerk ){
  var average_jerk_error = 0;
  for( var i = 0; i < input_jerk.length; i++ ){
    var sum_jerk = 0;
    for( var j = 0; j < input_jerk[i].length; j++ ){

      // 関節数 : 16 or 25
      if( num_of_joints == 16 ){
        if( (j != 3) && (j != 7) && (j != 11) && (j != 15) && (j != 19)&& (j != 21) && (j != 22) && (j != 23) && (j != 24) ){
          sum_jerk += ground_truth_jerk[i][j].distanceTo(input_jerk[i][j]);
        }
      } else {
        sum_jerk += ground_truth_jerk[i][j].distanceTo(input_jerk[i][j]);
      }

    }
    average_jerk_error += sum_jerk/25;
  }
  return average_jerk_error/input_jerk.length;
}



// input : フレームごとにboneのvectorデータを格納した配列
function calcAngularVelocity( all_data ){
  var angular_velocity_all_frames = new Array(end_frame);

  for (var frame = 0; frame < all_data.length; frame++) {
    var angular_per_bone = new Array(25);
    // t=0のときは角速度0
    if(frame == 0){
      angular_per_bone.fill(0);
    } else {
      for (var bone = 0; bone < 25; bone++) {
        var _cross_Vector = new THREE.Vector3().crossVectors( all_data[frame - 1][bone],
                                                              all_data[frame][bone]);
        var _sin_delta_cita = _cross_Vector.lengthSq() / (all_data[frame - 1][bone].lengthSq() * all_data[frame][bone].lengthSq());
        if( isNaN(_sin_delta_cita) ){
          angular_per_bone[bone] = 0;
        } else {
          angular_per_bone[bone] = Math.asin( _sin_delta_cita );
        }
      }
    }
    angular_velocity_all_frames[frame] = angular_per_bone;
  }
  return angular_velocity_all_frames;
}

// input : array( array( Quaternion, length=25 ))
// output : array( array( Quaternion, length=25 ))
function calcRollAngularVelocity( inputQuaternion ){
  var _deltaQuaternion = new Array(end_frame);
  for (var frame = 0; frame < end_frame; frame++) {
    var _frame_data = new Array(25);
    if( frame == 0 ){
      _frame_data.fill( new THREE.Quaternion(0, 0, 0, 0) );
    } else {
      for (var bone_index = 0; bone_index < 25; bone_index++) {
        var _t1_Quaternion = new THREE.Quaternion().copy(inputQuaternion[frame-1][bone_index]);
        var _t_Quaternion = new THREE.Quaternion().copy(inputQuaternion[frame][bone_index]);
        
        // quaternionでの各変位を算出して、オイラーに変換
        _frame_data[bone_index] = new THREE.Euler().setFromQuaternion( new THREE.Quaternion().multiplyQuaternions(_t_Quaternion, _t1_Quaternion.inverse()), "XYZ" );
      }
    }

    for (var bone = 0; bone < 25; bone++) {
      if( isNaN(_frame_data[bone].x) || isNaN(_frame_data[bone].y) || isNaN(_frame_data[bone].z) ){
        _frame_data[bone] = 0;
      } else {
        if( bone < 5){
          _frame_data[bone] = _frame_data[bone].y;
        } else if( (bone >= 5) && (bone < 17) ){
          _frame_data[bone] = _frame_data[bone].x;
        } else if( bone >= 17 ){
          _frame_data[bone] = _frame_data[bone].y;
        } 
        // if( bone < 5){
        //   _frame_data[bone] = _frame_data[bone].x;
        // } else if( (bone >= 5) && (bone < 17) ){
        //   _frame_data[bone] = _frame_data[bone].x;
        // } else if( bone >= 17 ){
        //   _frame_data[bone] = _frame_data[bone].x;
        // } 
      }
    }

    _deltaQuaternion[frame] = _frame_data;
  }
  return _deltaQuaternion;
}

// input : array( array( Quaternion, length=25 ))
// output : array( array( Quaternion, length=25 ))
function calcPitchAngularVelocity( inputQuaternion ){
  var _deltaQuaternion = new Array(end_frame);
  for (var frame = 0; frame < end_frame; frame++) {
    var _frame_data = new Array(25);
    if( frame == 0 ){
      _frame_data.fill( new THREE.Quaternion(0, 0, 0, 0) );
    } else {
      for (var bone_index = 0; bone_index < 25; bone_index++) {
        var _t1_Quaternion = new THREE.Quaternion().copy(inputQuaternion[frame-1][bone_index]);
        var _t_Quaternion = new THREE.Quaternion().copy(inputQuaternion[frame][bone_index]);
        
        // quaternionでの各変位を算出して、オイラーに変換
        _frame_data[bone_index] = new THREE.Euler().setFromQuaternion( new THREE.Quaternion().multiplyQuaternions(_t_Quaternion, _t1_Quaternion.inverse()), "XYZ" );
      }
    }

    for (var bone = 0; bone < 25; bone++) {
      if( isNaN(_frame_data[bone].x) || isNaN(_frame_data[bone].y) || isNaN(_frame_data[bone].z) ){
        _frame_data[bone] = 0;
      } else {
        if( bone < 5){
          _frame_data[bone] = _frame_data[bone].x;
        } else if( (bone >= 5) && (bone < 17) ){
          _frame_data[bone] = _frame_data[bone].y;
        } else if( bone >= 17 ){
          _frame_data[bone] = _frame_data[bone].x;
        } 
        // if( bone < 5){
        //   _frame_data[bone] = _frame_data[bone].y;
        // } else if( (bone >= 5) && (bone < 17) ){
        //   _frame_data[bone] = _frame_data[bone].y;
        // } else if( bone >= 17 ){
        //   _frame_data[bone] = _frame_data[bone].y;
        // } 
      }
    }

    _deltaQuaternion[frame] = _frame_data;
  }
  return _deltaQuaternion;
}


// input : array( array( Quaternion, length=25 ))
// output : array( array( Quaternion, length=25 ))
function calcDeltaAngular( inputQuaternion, correctQuaternion ){
  var _deltaQuaternion = new Array(end_frame);
  for (var frame = 0; frame < end_frame; frame++) {
    var _frame_data = new Array(25);
    for (var bone_index = 0; bone_index < 25; bone_index++) {
      var _correct_quaternion = new THREE.Quaternion().copy(inputQuaternion[frame][bone_index]);
      var _input_quaternion = new THREE.Quaternion().copy(inputQuaternion[frame][bone_index]);
      
      // quaternionでの各変位を算出して、オイラーに変換
      _frame_data[bone_index] = new THREE.Euler().setFromQuaternion( new THREE.Quaternion().multiplyQuaternions(_t_Quaternion, _t1_Quaternion.inverse()), "XYZ" );
    }

    for (var bone = 0; bone < 25; bone++) {
      if( isNaN(_frame_data[bone].x) || isNaN(_frame_data[bone].y) || isNaN(_frame_data[bone].z) ){
        _frame_data[bone] = 0;
      } else { 
        if( bone < 5){
          _frame_data[bone] = _frame_data[bone].y;
        } else if( (bone >= 5) && (bone < 17) ){
          _frame_data[bone] = _frame_data[bone].y;
        } else if( bone >= 17 ){
          _frame_data[bone] = _frame_data[bone].y;
        } 
      }
    }

    _deltaQuaternion[frame] = _frame_data;
  }
  return _deltaQuaternion;
}



// input : array( array( Quaternion, length=25 ))
// output : array( array( Quaternion, length=25 ))
function calcYawAngularVelocity( inputQuaternion ){
  var _deltaQuaternion = new Array(end_frame);
  for (var frame = 0; frame < end_frame; frame++) {
    var _frame_data = new Array(25);
    if( frame == 0 ){
      _frame_data.fill( new THREE.Quaternion(0, 0, 0, 0) );
    } else {
      for (var bone_index = 0; bone_index < 25; bone_index++) {
        var _t1_Quaternion = new THREE.Quaternion().copy(inputQuaternion[frame-1][bone_index]);
        var _t_Quaternion = new THREE.Quaternion().copy(inputQuaternion[frame][bone_index]);
        
        // quaternionでの各変位を算出して、オイラーに変換
        _frame_data[bone_index] = new THREE.Euler().setFromQuaternion( new THREE.Quaternion().multiplyQuaternions(_t_Quaternion, _t1_Quaternion.inverse()), "XYZ" );
      }
    }

    for (var bone = 0; bone < 25; bone++) {
      if( isNaN(_frame_data[bone].x) || isNaN(_frame_data[bone].y) || isNaN(_frame_data[bone].z) ){
        _frame_data[bone] = 0;
      } else {
        if( bone < 5){
          _frame_data[bone] = _frame_data[bone].z;
        } else if( (bone >= 5) && (bone < 17) ){
          _frame_data[bone] = _frame_data[bone].z;
        } else if( bone >= 17 ){
          _frame_data[bone] = _frame_data[bone].z;
        } 
      }
    }

    _deltaQuaternion[frame] = _frame_data;
  }
  return _deltaQuaternion;
}



// input : array( array( Quaternion, length=25 ))
// output : array( array( Quaternion, length=25 ))
function calcAngular( inputQuaternion, correctQuaternion ){
  var _deltaAngle = new Array(end_frame);
  var sum_x = 0;
  var sum_y = 0;
  var sum_z = 0;

  for (var frame = 0; frame < end_frame; frame++) {
    var _frame_data = new Array(25);
    for (var bone_index = 0; bone_index < 25; bone_index++) {
      var _input_quaternion   = new THREE.Euler().setFromQuaternion( new THREE.Quaternion().copy(  inputQuaternion[frame][bone_index]) );
      var _correct_quaternion = new THREE.Euler().setFromQuaternion( new THREE.Quaternion().copy(correctQuaternion[frame][bone_index]) );

      
      // quaternionでの各変位を算出して、オイラーに変換
      _frame_data[bone_index] = [ Math.pow((_correct_quaternion.x - _input_quaternion.x), 2),
                                  Math.pow((_correct_quaternion.y - _input_quaternion.y), 2),
                                  Math.pow((_correct_quaternion.z - _input_quaternion.z), 2) ];
    }
    _deltaAngle[frame] = _frame_data;
  }

  for (var frame = 0; frame < end_frame; frame++) {
    for (var bone_index = 0; bone_index < 25; bone_index++) {
      if( (bone_index != 4) && (bone_index != 8) && (bone_index != 9) && (bone_index != 10) && (bone_index != 14) && (bone_index != 15) && (bone_index != 16) && (bone_index != 20) && (bone_index != 24)  ){
        if( isNaN(_deltaAngle[frame][bone_index][0]) || isNaN(_deltaAngle[frame][bone_index][1]) || isNaN(_deltaAngle[frame][bone_index][2]) ){
          console.log( "nan" );
        } else {
          sum_x += _deltaAngle[frame][bone_index][0];
          sum_y += _deltaAngle[frame][bone_index][1];
          sum_z += _deltaAngle[frame][bone_index][2];
        }
      }
    }
  }

  return [sum_x, sum_y, sum_z];
}



// 主要16関節の角速度のエラーを出す
function calcAAVE( inputRadian, correctRadian ){
  var _total_error = 0;

  for (var frame = 0; frame < end_frame; frame++) {
    for (var bone_index = 0; bone_index < 25; bone_index++) {
      if( (bone_index != 0) && (bone_index != 5) && (bone_index != 10) && (bone_index != 11) &&
          (bone_index != 16) && (bone_index != 4) && (bone_index != 20) && (bone_index != 24) ){
        _total_error += Math.abs(correctRadian[frame][bone_index] - inputRadian[frame][bone_index]);
      }
    }
  }
  return _total_error/(end_frame * 16);
}


// 主要16関節の角速度のエラーを出す
function calcAFAVE( inputRadian, correctRadian ){
  var _total_error = 0;

  for (var frame = 0; frame < end_frame; frame++) {
    for (var bone_index = 0; bone_index < 25; bone_index++) {
      if( (bone_index != 0) && (bone_index != 5) && (bone_index != 10) && (bone_index != 11) &&
          (bone_index != 16) && (bone_index != 4) && (bone_index != 20) && (bone_index != 24) ){

        _total_error += Math.abs(correctRadian[frame][bone_index] - inputRadian[frame][bone_index]);
      }
    }
  }
  return _total_error/(end_frame * 16);
}


// About : Quaternionの w の変位を算出
// input : Quaternion w[ 25[quaternion w], ..., end frame ]
function calcDeltaQuaternionW( inputQuaternion ){
  var _deltaQuaternion = new Array(end_frame);
  for (var frame = 0; frame < end_frame; frame++) {
    var _frame_data = new Array(25);
    if( frame == 0 ){
      _frame_data.fill( 0 );
    } else {
      // console.log( inputQuaternion );
      for (var bone_index = 0; bone_index < 25; bone_index++) {
        var _t1_Quaternion = new THREE.Quaternion().copy(inputQuaternion[frame-1][bone_index]);
        var _t_Quaternion = new THREE.Quaternion().copy(inputQuaternion[frame][bone_index]);
        
        // quaternionでの各変位を算出して、オイラーに変換
        _frame_data[bone_index] = Math.abs(_t_Quaternion.w - _t1_Quaternion.w);
      }
    }
    _deltaQuaternion[frame] = _frame_data;
  }
  return _deltaQuaternion;
}

// delta wの誤差を算出
function calcMeanSquaredDeltaW( inputDeltaW, correctDeltaW ){
  var _total_error = 0;
  for (var frame = 0; frame < end_frame; frame++) {
    for (var bone_index = 0; bone_index < 25; bone_index++) {
      if( (bone_index != 0) && (bone_index != 5) && (bone_index != 10) && (bone_index != 11) &&
          (bone_index != 16) && (bone_index != 4) && (bone_index != 20) && (bone_index != 24) ){
        if( Math.sqrt( Math.pow(correctDeltaW[frame][bone_index], 2 ) - Math.pow(inputDeltaW[frame][bone_index], 2))){
          _total_error += Math.sqrt( Math.pow(correctDeltaW[frame][bone_index], 2 ) - Math.pow(inputDeltaW[frame][bone_index], 2) );
        }
      }
    }
  }
  return _total_error/(end_frame * 16);
}
