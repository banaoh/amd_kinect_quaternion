require 'csv'

csvFiles = []

array = []
output_array = []
sorted_array = []

p '-----All files----'
csvFiles = Dir.glob("../datas/raw_datas/*.csv").each_with_index do |file, index|
    puts "[#{index}]:#{file}\n"
end

p '-----Select file Index (input number)----'
fileName = csvFiles[gets.to_i]


csv_data = CSV.read(fileName, headers: false)
puts "start..."


# frame, bone番号とクオータニオンにする関数
# [frame, [bone番号, xyzw], [bone番号, xyzw] ... ]
def createArray(rowArray)
    _separatedArray = []
    rowArray.each_with_index do |array, i|
        bone_index = 0
        hip_array = []
        bone_array = []
        skeleton_array = []
        loop_count = 0

        # フレームを記録
        # skeleton_array.push(i)

        array.each_with_index do |data, j|
            # hipの処理（xyz, xyzwを持っている）
            if(loop_count==0)
                bone_array.push(bone_index)
                bone_index += 1
            end
            bone_array.push(data)
            loop_count += 1

            if(bone_array.length == 8)
                skeleton_array.push(bone_array)
                bone_array = []
                loop_count = 0
            end
        end
        _separatedArray.push(skeleton_array)
    end
    return _separatedArray
end

def sortForKinectStructure(separatedArray)
    _sortedArray = []
    # for i in 0..separatedArray.length - 1
    #     _sortedArray.insert(i, [
    #         separatedArray[i][0],
    #         separatedArray[i][1],
    #         separatedArray[i][3],
    #         separatedArray[i][4],
    #         separatedArray[i][9],
    #         separatedArray[i][10],
    #         separatedArray[i][11],
    #         separatedArray[i][12],
    #         separatedArray[i][5],
    #         separatedArray[i][6],
    #         separatedArray[i][7],
    #         separatedArray[i][8],
    #         separatedArray[i][16],
    #         separatedArray[i][17],
    #         separatedArray[i][18],
    #         separatedArray[i][20],
    #         separatedArray[i][13],
    #         separatedArray[i][14],
    #         separatedArray[i][15],
    #         separatedArray[i][19],
    #         separatedArray[i][2],
    #         separatedArray[i][42],
    #         separatedArray[i][36],
    #         separatedArray[i][27],
    #         separatedArray[i][21]
    #     ])
    # end

    for i in 0..separatedArray.length - 1
        _sortedArray.insert(i, [
            separatedArray[i][0],
            separatedArray[i][1],
            separatedArray[i][3],
            separatedArray[i][4],
            separatedArray[i][5],
            separatedArray[i][6],
            separatedArray[i][7],
            separatedArray[i][8],
            separatedArray[i][9],
            separatedArray[i][10],
            separatedArray[i][11],
            separatedArray[i][12],
            separatedArray[i][13],
            separatedArray[i][14],
            separatedArray[i][15],
            separatedArray[i][19],
            separatedArray[i][16],
            separatedArray[i][17],
            separatedArray[i][18],
            separatedArray[i][20],
            separatedArray[i][2],
            separatedArray[i][27],
            separatedArray[i][21]
            separatedArray[i][42],
            separatedArray[i][36],
        ])
    end

    return _sortedArray
end

output_csv = CSV.generate do |csv|
    csv_data.each_with_index do |data, i|
        if i > 6
            data.delete_at(0)
            data.delete_at(0)
            array.push(data)
            csv << data
        end
    end
end

output_array = createArray(array)
sorted_array = sortForKinectStructure(output_array)
print sorted_array


File.open("../datas/outputs/test0.csv", 'w') do |file|
  file.write(sorted_array)
end

puts "complete! See intro.txt."