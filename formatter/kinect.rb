# TODO
# ruby -i -pe 'sub("\r\n", "\n")' filenameを自動化する
# 1-3行目を削除（header）
# 1-2列を削除（時間、bone-index）
# 空行を削除...書き出し側を調節
# [3,6]がquaternion

require 'csv'

csvFiles = []
output_csv = []
sorted_array = []
skeleton_array = []
tmp_array = []
kinect_input_data = []

p '-----All files----'
csvFiles = Dir.glob("../datas/raw_datas/kinect*cut.csv").each_with_index do |file, index|
# csvFiles = Dir.glob("../datas/raw_datas/previous/kinect*.csv").each_with_index do |file, index|
    puts "[#{index}]:#{file}\n"
end

p '-----Select file Index (input number)----'
fileNum = gets.to_i
fileName = csvFiles[fileNum]


# csv_data = CSV.read("../datas/test_kinect_cut.csv", headers: false)
csv_data = []
CSV.foreach(fileName, {skip_blanks: true}) do |row|
  csv_data.push(row)
end

# frame, bone番号とクオータニオンにする関数
# [frame, [bone番号, xyzw], [bone番号, xyzw] ... ]
def createArray(csvArray, output_array)
    frame = 0
    skeleton_array = []
    loop_count = 0

    csvArray.each_with_index do |array, i|    
        if(!array.empty?)
            if(loop_count==0)
                skeleton_array.push(frame)
            end
            skeleton_array.push(array)
            loop_count += 1

            if(skeleton_array.length == 25)
                output_array.push(skeleton_array)
                loop_count=0
                frame+=1
                skeleton_array = []
            end
        end
    end
end

# puts csv_data
csv_data.each_with_index do |data, i|
    if(skeleton_array.length != 24)
        puts data[3]
        skeleton_array.push(data[3,4])
        puts 'skeleton pushed'
    else
        puts '==============================='
        puts data[3]
        skeleton_array.push(data[3,4])
        puts 'skeleton pushed'
        tmp_array.push(skeleton_array)
        puts 'tmp pushed'
        skeleton_array = []
    end
end
# tmp_array.each do |data|
#   print data.length
# end
print tmp_array
# 配列の添字をフレーム数とし、全データを一次元配列として格納
tmp_array.each_with_index do |data_per_frame, index|
    bones_data = []
    data_per_frame.map do |bone_array|
        bone_array.each do |quaternion_data|
            bones_data.push( quaternion_data )
        end
    end
    kinect_input_data.push(bones_data)
end

# print array
# print output_csv
# createArray(array, output_csv)

# outputFileName = fileName.slice(/kinect[0-9\-]*/)
# fileNum_added = fileNum + 1

CSV.open("../datas/outputs/kinect_" + (fileNum + 1).to_s + "_formatted.csv", 'w') do |csv|
# CSV.open("../datas/test_kinect_cut_formatted.csv", 'w') do |csv|
# CSV.open("../datas/outputs/" + outputFileName + "-formatted.csv", 'w') do |csv|
# CSV.open("../datas/outputs/kinect-2017-0706-0538_formatted.csv", 'w') do |csv|
  # csv << sorted_array
  kinect_input_data.each do |data|
    csv << data
  end
end

puts "complete! See kinect_" + (fileNum + 1).to_s + "_formatted.csv"
