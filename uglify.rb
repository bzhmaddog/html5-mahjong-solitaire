    require 'uglifier'
     
    File.open("outfile.min.js", "w") do |file|
    file.write Uglifier.compile(File.read("lib/jQuery.mobile/jquery.mobile-1.3.2.js"), :output => {:comments => :none}, :screw_ie8 => false)
    #file.write Uglifier.compile(File.read("lib/jQuery/jquery-1.10.2.js"), :output => {:comments => :none})
    end