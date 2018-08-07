# formatterを使う前にquaternionのデータだけにする
# 1~7行目を削除
# 1~2列を削除

require 'csv'

csvFiles = []

array = []
output_array = []
sorted_array = []

# ファイルを参照
# p '-----All files----'
# csvFiles = Dir.glob("../datas/raw_datas/experiment/mo_cross_arms_front_cut.csv").each_with_index do |file, index|
#     puts "[#{index}]:#{file}\n"
# end

# p '-----Select file Index (input number)----'
# fileIndex = gets.to_i
# if((fileIndex >=  0) && (fileIndex <= csvFiles.length ))
#     fileName = csvFiles[fileIndex]
# else
#     puts 'そんなfileないっす'
#     return false
# end

# csv_data = CSV.read("../datas/raw_datas/mocap_" + (fileIndex + 1).to_s + "_for_test_cut.csv", headers: false)
csv_data = CSV.read("../datas/raw_datas/experiment/mo_cross_arms_front_cut.csv", headers: false)
puts "start..."
data = []


def createArray(rowArray)
    skeleton_data_all_frame = []
    rowArray.each_with_index do |array, i|
        bone_index = 0
        hip_array = []
        bone_array = []
        skeleton_array_per_frame = []
        loop_count = 0

        # フレームを記録
        array.each_with_index do |data, j|
            # hipの処理（xyz, xyzwを持っている）
            if(loop_count == 0)
                # hipのpush
                if(bone_array.length == 6)
                    bone_array.push(data)
                    skeleton_array_per_frame.push(bone_array)
                    loop_count = loop_count + 1
                    bone_array = []
                else
                    bone_array.push(data)
                end
            # hip以外のbone
            # quaternion = x,y,z,wで保存されている 
            else
                if(bone_array.length == 3)
                    bone_array.push(data)
                    skeleton_array_per_frame.push(bone_array)
                    bone_array = []
                else
                    bone_array.push(data)
                end
            end
        end
        skeleton_data_all_frame.push(skeleton_array_per_frame)
    end
    return skeleton_data_all_frame
end

def sortForKinectStructure(separatedArray)
    _sortedArray = []
    for i in 0..separatedArray.length - 1
        _sortedArray.insert(i, [
          
            separatedArray[i][0][0,4], # hip
            separatedArray[i][1], # spine_mid
            separatedArray[i][2],  # spine_shoulder 20
            separatedArray[i][3], # neck
            separatedArray[i][4], # head
            
            [0, 0, 0, 1], #5
            separatedArray[i][6], # shoulder_left
            separatedArray[i][7], # elbow_left
            separatedArray[i][8], # wrist_left
            # separatedArray[i][8], # hand_left
            
            [0, 0, 0, 1], #9
            [0, 0, 0, 1], #10

            [0, 0, 0, 1], #11
            separatedArray[i][10],  # shoulder_right
            separatedArray[i][11], # elbow_right
            separatedArray[i][12], # wrist
 
            # ======= 正しい　15が erot =========

            [0, 0, 0, 1], #15
            [0, 0, 0, 1], #16
           
            [0, 0, 0, 1], #17
            separatedArray[i][13], # hip_left
            separatedArray[i][14], # knee_left
            separatedArray[i][15], # ankle_left

            # コメントアウト, 元コード
            [0, 0, 0, 1], #21
            separatedArray[i][16], # hip
            separatedArray[i][17], # knee
            separatedArray[i][18] # ankle

        ])
    end
    return _sortedArray
end

output_csv = CSV.generate do |csv|
    csv_data.each_with_index do |data, i|
        array.push(data)
        csv << data
    end
end

output_array = createArray(array)
sorted_array = sortForKinectStructure(output_array)

# mocapの格納データ
mocap_input_data = []

# 配列の添字をフレーム数とし、全データを一次元配列として格納
sorted_array.each_with_index do |data_per_frame, index|
  bones_data = []
  data_per_frame.map do |bone_array|
    bone_array.each do |quaternion_data|
      bones_data.push( quaternion_data )
    end
  end
  mocap_input_data.push(bones_data)
end
# print mocap_input_data

# CSV.open("../datas/outputs/mocap_" + (fileIndex + 1).to_s + "_for_test_cut.csv", 'w') do |csv|
CSV.open("../datas/raw_datas/experiment/dataset//mo_cross_arms_front_cut.csv", 'w') do |csv|
  # csv << sorted_array
  mocap_input_data.each do |data|
    csv << data
  end
end

puts "complete!"
