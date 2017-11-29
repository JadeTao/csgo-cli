"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const query_1 = require("./query");
const util_1 = require("./util");
exports.config = {
    version: '0.1.0',
    command: [
        {
            name: 'team [name]',
            alias: 't',
            description: 'query team info, one team for one time',
            option: [
                ['-m --match', 'query recent matches'],
                ['-o --overview', 'query overview'],
                ['-p --player', 'query players of this team'],
                ['-r --ranking', 'query current ranking']
            ],
            handler: (name, options) => {
                if (name)
                    name = name.toLowerCase();
                if (options.match && !options.overview && !options.player && !options.ranking) {
                    if (!util_1.teamCheck(name))
                        return;
                    util_1.log.hint(`querying recent matches of team ${name}...`);
                    query_1.printTeamMatches(name);
                    return;
                }
                if (!options.match && options.overview && !options.player && !options.ranking) {
                    if (!util_1.teamCheck(name))
                        return;
                    util_1.log.hint(`querying team overview of team ${name}...`);
                    query_1.printTeamOverview(name);
                    return;
                }
                if (!options.match && !options.overview && options.player && !options.ranking) {
                    if (!util_1.teamCheck(name))
                        return;
                    util_1.log.hint(`querying players of team ${name}...`);
                    query_1.printTeamPlayers(name);
                    return;
                }
                if (!options.match && !options.overview && options.ranking) {
                    util_1.log.hint(`querying current team ranking of all team...`);
                    query_1.printTeamRanking();
                    return;
                }
                util_1.log.warn("a valid option is required, see 'csgo team -h'");
            }
        },
        {
            name: 'match',
            alias: 'm',
            description: 'query the time table of upcoming matches',
            option: [],
            handler: () => {
                util_1.log.hint('querying the time table of upcoming matches...');
                query_1.printUpcomingMatches();
            }
        },
        {
            name: 'player',
            alias: 'p',
            description: 'query player info',
            option: [],
            handler: (name) => {
                if (!util_1.playerCheck(name))
                    return;
                util_1.log.hint(`querying info of ${name}...`);
                query_1.printPlayer(name);
            }
        }
    ]
};
