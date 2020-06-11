#!/usr/bin/env node
"use strict";
const { program } = require("commander");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs");
const packageDotJson = require("../package.json");
const template = require("../config.template");
const main = require("../index");

function setConfig(fn) {
	try {
		return require(path.resolve(fn));
	} catch (_) {
		console.error(chalk.bold.red("Error: config file is invalid."));
		return {};
	}
}

function generateConfig(value) {
	const fpath = path.normalize(value);
	if (fs.existsSync(fpath)) {
		console.error(chalk.red.bold("Error: A file already exists at", value));
		return;
	}
	fs.copyFileSync(
		path.join(__dirname, "..", "config.template.js"),
		path.normalize(value)
	);
	console.log(
		"Configuration file created at",
		chalk.yellow.bold(path.normalize(value))
	);
}

// to prevent radix-fucking from surprise extra arguments
const choke = (n) => parseInt(n);

program.description(chalk.yellow.bold("cross-seed"));
program.version(
	packageDotJson.version,
	"-v, --version",
	"output the current version"
);
program.name(packageDotJson.name);

program
	.command("gen-config <path>")
	.description("Generate a config file at the specified path")
	.action(generateConfig);

program
	.command("search")
	.description("Search for cross-seeds")
	.option("-c, --config <path>", "Path to configuration file", setConfig)
	.option("-u, --jackett-server-url <url>", "Your Jackett server url")
	.option("-k, --jackett-api-key <key>", "Your Jackett API key")
	.option("-d, --delay <delay>", "Pause duration between searches", choke)
	.option("-t, --tracker <tracker>", "Jackett tracker id to search")
	.option("-i, --torrent-dir <dir>", "Directory with torrent files")
	.option("-s, --output-dir <dir>", "Directory to save results in")
	.option("-o, --offset <offset>", "Offset to start from", choke)
	.action((command) => {
		const { config: configFile, ...overrides } = command.opts();
		Object.keys(overrides).forEach((key) => {
			if (overrides[key] === undefined) delete overrides[key];
		});
		const emptyTemplate = Object.keys(template).reduce(
			(acc, cur) => ({ ...acc, [cur]: undefined }),
			{}
		);
		const config = { ...emptyTemplate, ...configFile, ...overrides };
		const valid = Object.entries(emptyTemplate).reduce((acc, [k, v]) => {
			if (v === undefined) {
				console.error(chalk.red("Missing configuration item:"), k);
				return false;
			}
			return acc;
		}, true);

		if (!valid) {
			console.error("Please specify the missing item(s) in");
			console.error("a configuration file or as command-line options.");
			console.error(
				"For more information, run\n\n\tcross-seed search --help\n"
			);
			return;
		}
		try {
			main(config);
		} catch (e) {
			console.error(chalk.bold.red(e.message));
		}
	});

program.parse();
