File.open(ARGV[0]).each_line { |line| puts line unless /^\r\n/ =~ line } 
