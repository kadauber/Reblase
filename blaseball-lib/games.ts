import { PlayerID, TeamID } from "./common";
import { BlaseballGame } from "./models";

export interface GameTeam {
    id: TeamID;
    name: string;
    nickname: string;
    emoji: string;
    color: string;
    secondaryColor?: string;

    isBatting: boolean;
    isPitching: boolean;

    odds: number;
    score: number;
    opposingScore: number;

    batter: PlayerID | null;
    batterName: string | null;
    pitcher: PlayerID | null;
    pitcherName: PlayerID | null;

    totalBases: number;
    maxStrikes: number;
}

const nullIfEmpty = (s: string | null) => (s === "" ? null : s);

export function getHomeTeam(game: BlaseballGame): GameTeam {
    return {
        id: game.homeTeam,
        name: game.homeTeamName,
        nickname: game.homeTeamNickname,
        emoji: game.homeTeamEmoji,
        color: game.homeTeamColor,
        secondaryColor: game.homeTeamSecondaryColor,

        isBatting: !game.topOfInning,
        isPitching: game.topOfInning,

        odds: game.homeOdds,
        score: game.homeScore,
        opposingScore: game.awayScore,

        batter: nullIfEmpty(game.homeBatter),
        batterName: nullIfEmpty(game.homeBatterName),
        pitcher: nullIfEmpty(game.homePitcher),
        pitcherName: nullIfEmpty(game.homePitcherName),

        totalBases: game.homeBases ?? 4,
        maxStrikes: game.homeStrikes ?? 3,
    };
}

export function getAwayTeam(game: BlaseballGame): GameTeam {
    return {
        id: game.awayTeam,
        name: game.awayTeamName,
        nickname: game.awayTeamNickname,
        emoji: game.awayTeamEmoji,
        color: game.awayTeamColor,
        secondaryColor: game.awayTeamSecondaryColor,

        isBatting: game.topOfInning,
        isPitching: !game.topOfInning,

        odds: game.awayOdds,
        score: game.awayScore,
        opposingScore: game.homeScore,

        batter: game.awayBatter,
        batterName: game.awayBatterName,
        pitcher: game.awayPitcher,
        pitcherName: game.awayPitcherName,

        totalBases: game.awayBases ?? 4,
        maxStrikes: game.awayStrikes ?? 3,
    };
}

export function getBattingTeam(game: BlaseballGame): GameTeam {
    return game.topOfInning ? getAwayTeam(game) : getHomeTeam(game);
}

export function getPitchingTeam(game: BlaseballGame): GameTeam {
    return game.topOfInning ? getHomeTeam(game) : getAwayTeam(game);
}

export interface BaseState {
    filled: boolean;
    baserunner: PlayerID | null;
    baserunnerName: string | null;
}

export interface GameState {
    balls: number;
    maxBalls: number;

    strikes: number;
    maxStrikes: number;

    outs: number;
    maxOuts: number;

    homeScore: number;
    awayScore: number;

    bases: BaseState[];
}

export function getGameState(game: BlaseballGame): GameState {
    const bases = [];

    const highestRunnableBase = ((game.topOfInning ? game.awayBases : game.homeBases) ?? 4) - 2;
    const highestFilledBase = Math.max(...game.basesOccupied);
    for (let i = 0; i <= Math.max(highestFilledBase, highestRunnableBase); i++) {
        const runnerIndex = game.basesOccupied.indexOf(i);
        bases.push({
            filled: runnerIndex !== -1,
            baserunner: game.baseRunners[runnerIndex] ?? null,
            baserunnerName: (game.baseRunnerNames ?? [])[runnerIndex] ?? null,
        });
    }

    return {
        balls: game.atBatBalls,
        maxBalls: 3, // for now...

        strikes: game.atBatStrikes,
        maxStrikes: (game.topOfInning ? game.awayStrikes : game.homeStrikes) ?? 3,

        outs: game.halfInningOuts,
        maxOuts: 3, // for now...

        homeScore: game.homeScore,
        awayScore: game.awayScore,

        bases: bases,
    };
}

export function isGameUpdateImportant(update: string) {
    for (const pattern of [
        // TODO once 5th base lands, are these correct?
        /hits a (Single|Double|Triple|Quadruple|grand slam)/,
        /hits a (solo|2-run|3-run|4-run) home run/,
        /steals (second base|third base|fourth base|fifth base|home)/,
        /scores/,
        /(2s|3s|4s) score/,
        /Rogue Umpire/,
        /feedback/,
        /Reverb/,
        /(yummy|allergic) reaction/,
        /Blooddrain/,
        /Unstable/,
        /Flickering/,
        /hits [\w\s]+ with a pitch/,
        /The Shame Pit/,
        /Red Hot/,
        /they peck [\w\s]+ free!/,
        /Big Peanut/,
        /flock of Crows/,
    ]) {
        if (pattern.test(update)) return true;
    }
    return false;
}
