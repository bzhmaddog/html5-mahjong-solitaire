#Compass CSS framework config file
#require "susy"

module Sass::Script::Functions
	def images_dir()
		Sass::Script::String.new('../res')
	end
end

project_type = :stand_alone
http_path = "/"
#sass_options = {:debug_info => true}
sass_dir = "scss"
css_dir = "css-debug"
#images_dir = "res/img"
#sass_options = {:images_dir => '../res'}
line_comments = false
preferred_syntax = :scss
output_style = :expanded
relative_assets = true