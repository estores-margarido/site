/*jslint node: true */

"use strict";

module.exports = function(grunt) {
	var path = require('path'), tasks = {}, cwd = process.env.PWD
			|| process.cwd();

	var src = [ cwd + '/src/*.js' ];

	/**
	 * Function to generate the destination for the uglify task (e.g.
	 * build/file.min.js). This function will be passed to the rename property
	 * of files array when building dynamically:
	 * http://gruntjs.com/configuring-tasks#building-the-files-object-dynamically
	 *
	 * @param {String}
	 *            destPath the current destination
	 * @param {String}
	 *            srcPath the matched src path
	 * @return {String} The rewritten destination path.
	 */
	var uglify_rename = function(destPath, srcPath) {
		destPath = srcPath.replace('src', 'js');
		destPath = destPath.replace('.js', '.min.js');
		destPath = path.resolve(cwd, destPath);
		return destPath;
	};

	// Load all grunt tasks.
	grunt.loadNpmTasks("grunt-csso");
	grunt.loadNpmTasks("grunt-contrib-less");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt
			.initConfig({
				pkg : grunt.file.readJSON('package.json'),
				banner : '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - '
						+ '<%= grunt.template.today("yyyy-mm-dd") %>\n'
						+ '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>'
						+ '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;'
						+ ' License <%= pkg.license %> */\n',
				watch : {
					options : {
						nospawn : false
					// We need not to spawn so config can be changed
					// dynamically.
					},
					less : {
						// If any .less file changes in directory "less" then
						// run the "less" task.
						files : "less/**/*.less",
						tasks : [ "less" ]
					}
				},
				jshint : {
					options : {
						jshintrc : '.jshintrc'
					},
					js : {
						src : [cwd + "/src/*.js", "!"+cwd + "/src/_*.js"]
					}
				},
				uglify : {
					js : {
						files : [ {
							expand : false,
							src : "src/header/**/*.js",
							dest : "js/header.min.js"
						},
						{
							expand : false,
							src : "src/footer/**/*.js",
							dest : "js/footer.min.js"
						},
						{
							expand : true,
							src : src,
							rename : uglify_rename
						} ]
					}
				},
				less : {
					// Production config is also available.
					development : {
						options : {
							// Specifies directories to scan for @import
							// directives when parsing.
							// Default value is the directory of the source,
							// which is probably what you want.
							paths : [ "less/" ],
							compress : false
						},
						// This dynamically creates the list of files to be
						// processed.
						files : [ {
							expand : true,
							cwd : "less/",
							src : [ "*.less", "!_*.less" ],
							dest : "style/",
							ext : ".css"
						} ]
					},
				},
				csso : {
					build : {
						options : {
							report : 'gzip',
							banner: '<%= banner %>'
						},
						files : {
							'style/em.css' : 'style/em.css'
						}
					}
				}
			});

	tasks.startup = function() {
		// Run them all!.
		grunt.task.run('css');
		grunt.task.run('js');
	};

	// On watch, we dynamically modify config to build only affected files. This
	// method is slightly complicated to deal with multiple changed files at
	// once (copied
	// from the grunt-contrib-watch readme).
	var changedFiles = Object.create(null);
	var onChange = grunt.util._.debounce(function() {
		var files = Object.keys(changedFiles);
		grunt.config('jshint.js.src', files);
		grunt.config('uglify.js.files', [ {
			expand : true,
			src : files,
			rename : uglify_rename
		} ]);
		changedFiles = Object.create(null);
	}, 200);

	grunt.event.on('watch', function(action, filepath) {
		changedFiles[filepath] = action;
		onChange();
	});

	grunt.registerTask('js', [ 'jshint', 'uglify' ]);

	// Register CSS taks.
	grunt.registerTask('css', [ 'less', 'csso' ]);

	// Register the startup task.
	grunt.registerTask('startup',
			'Run the correct tasks for the current directory', tasks.startup);

	// Register the default task.
	grunt.registerTask('default', [ 'startup' ]);
};
