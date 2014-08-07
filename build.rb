# encoding: UTF-8
require 'rubygems'
require 'json'
require 'pp'
require 'uglifier'
require 'cssmin'

def parse(filename, level)

	indent = "";
	for i in 0..level-1
	indent = indent + "    "
	end

	print indent
	print "Parsing "
	print filename
	print "\n"

	# open main file
	file = File.open(filename, "r");

	# read main html
	html = "";
	file.each {|line| html += line }

	parsedhtml = html;

	# Search all REPLACE tags
	html.scan(/(<!--REPLACE.*?(\{.*?\}).*?-->(.*?)<!--\/REPLACE-->)/msi).each do |match|

		# Parse JSON string to create config object
		config = JSON.parse(match[1]);
		fname = config['file'];


		if config['active'] == true

			print indent
			print "Merging : "
			print fname;
			print "\n"

				if config['parse'] == true
					phtml = parse(fname, level + 1);
				else
					phtml = "";
					pfile = File.open(fname, "r");
					pfile.each {|line| phtml += line }
				end

				if config['minify'] == true
					print indent
					print "    > Minifying ...\n"
					if config['type'] == 'script'
						phtml = Uglifier.compile(phtml, :output => {:comments => :none});
					elsif config['type'] == 'style'
						phtml = CSSMin.minify(phtml);
					end
				end

				if config['type'] == 'script'
					phtml = "<script>" + phtml + "</script>"
				elsif config['type'] == 'style'
					phtml = "<style>" + phtml + "</style>"
				end

			parsedhtml = parsedhtml.gsub(match[0], phtml);
		else
			print "Skipping : "
			print fname
			print "\n"
		end
	end # scan.each

#print matches;
#test = File.new("test.txt", "w+");

#test.puts(matches);
#print matches;

	# STRIP  REMOVE tags
	#parsedhtml = parsedhtml.gsub(/<!--REMOVE-->.*?<!--\/REMOVE-->/msi, '');

	return parsedhtml;
end

#exec("compass compile --config ./config_prod.rb --force")

finalhtml = parse("main.html", 0);

outfile = File.new("final.html", "w+");

outfile.puts(finalhtml);

print "Done."