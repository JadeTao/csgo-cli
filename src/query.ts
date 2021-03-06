import * as Table from 'cli-table3'
import HLTV from 'hltv'

import { MONTH, PLAYER, TEAM } from './constant'
import { log, printTimeWrap } from './util'

interface ITableData {
  head: string[];
  value: any[];
}

interface IError {
  name: string;
  errno: string;
}

/**
 * used as Promise reject handler
 * @param err  error
 */
const handleError = (err: IError) => {
  log.error('\n')
  log.error(`${err.name} ${err.errno}`)
}

/**
 * public part of some of the following query functions
 * @param name team name
 */
const getTeam = (name: string) => HLTV.getTeam({ id: TEAM[name] })

/**
 * public part of some of the following query functions
 * @param name team name
 */
const getTeamStats = (name: string) => HLTV.getTeamStats({ id: TEAM[name] })

/**
 * query recent match according to team name
 * async function return a data source for cli-table
 * @param name team name
 */
const getTeamMatches = async (name: string): Promise<ITableData> => {
  try {
    const res = await getTeam(name)
    const tableData: ITableData = {
      head: ['opponent', 'result', 'event'],
      value: [],
    }
    res.recentResults.forEach((m) => {
      tableData.value.push([m.enemyTeam.name, m.result, m.event.name])
    })
    return tableData
  } catch (e) {
    handleError(e)
  }
}

/**
 * query overview according to team name
 * async function return a data source for cli-table
 * @param name ,team name
 */
const getTeamOverview = async (name: string): Promise<ITableData> => {
  try {
    const res = await getTeamStats(name)
    const tableData: ITableData = {
      head: ['key', 'value'],
      value: [],
    }
    const keys = Object.keys(res.overview)
    keys.forEach((k) => {
      const item = {}
      item[k] = res.overview[k]
      tableData.value.push(item)
    })
    return tableData
  } catch (e) {
    handleError(e)
  }
}

/**
 * query players according to team name
 * async function return a data source for cli-table
 * @param name ,team name
 */
const getTeamPlayers = async (name: string): Promise<ITableData> => {
  try {
    const res = await getTeamStats(name)
    const tableData: ITableData = {
      head: ['currentPlayers', 'historicPlayers', 'standinPlayers'],
      value: [],
    }
    const { currentLineup, historicPlayers, standins } = res
    const length = Math.max(currentLineup.length, historicPlayers.length, standins.length)

    Array.from({ length }, (v, i) => i).forEach((n) => {
      const row = []
      row[0] = currentLineup[n] ? currentLineup[n].name : ''
      row[1] = historicPlayers[n] ? historicPlayers[n].name : ''
      row[2] = standins[n] ? standins[n].name : ''
      tableData.value.push(row)
    })
    return tableData
  } catch (e) {
    handleError(e)
  }
}

/**
 * query current all teams ranking
 * async function return a data source for cli-table
 * TODO: support query historic rankings
 */
const getTeamRanking = async (): Promise<ITableData> => {
  try {
    const res = await HLTV.getTeamRanking()
    const tableData: ITableData = {
      head: ['ranking', 'name', 'points', 'change'],
      value: [],
    }
    res.forEach((p) => {
      const row = [p.place, p.team.name, p.points, p.change]
      tableData.value.push(row)
    })
    return tableData
  } catch (e) {
    handleError(e)
  }
}

/**
 * query the time table of upcoming matches
 * async function return a data source for cli-table
 */
const getUpcomingMatches = async (): Promise<ITableData> => {
  try {
    const res = await HLTV.getMatches()
    const tableData = {
      head: ['stars', 'date', 'team-A', 'team-B', 'format', 'event'],
      value: [],
    }
    res.forEach((m) => {
      const container = '★ ★ ★ ★ ★ ★ ★ ★ ★ ★'
      const starNum: number = m.stars
      const stars: string = container.slice(0, 2 * starNum)

      let date: string = '-'
      if ('date' in m) {
        (date as any) = m['date']
        const dateT: Date = new Date(date)
        date = dateT.toLocaleString()
      }

      let team1: string = ''
      let team2: string = ''
      if (m.team1) { team1 = m.team1.name }
      if (m.team2) { team2 = m.team2.name }

      let event: string = ''
      if (m.event) { event = m.event.name }

      tableData.value.push([stars, date, team1, team2, m.format, event])
    })

    return tableData
  } catch (e) {
    handleError(e)
  }
}

/**
 * async function return a data source for cli-table
 * @param name ,player name
 */
const getPlayer = async (name: string): Promise<ITableData> => {
  try {
    const res = await HLTV.getPlayer({ id: PLAYER[name] })
    const tableData: ITableData = {
      head: ['key', 'value'],
      value: [],
    }
    // 这段代码有优化的必要吗？
    const value = tableData.value
    value.push({ name: res.name })
    value.push({ ['name in game']: res.ign })
    value.push({ age: res.age })
    value.push({ team: res.team && res.team.name || '' })
    value.push({ country: res.country.name })
    value.push({ [' ']: ' ' })
    value.push({ statistics: '' })
    value.push({ rating: res.statistics.rating })
    value.push({ killsPerRound: res.statistics.killsPerRound })
    value.push({ headshots: `${res.statistics.headshots}%` })
    value.push({ mapsPlayed: res.statistics.mapsPlayed })
    value.push({ deathPerRound: res.statistics.deathsPerRound })
    value.push({ roundsContributed: res.statistics.roundsContributed })
    value.push({ [' ']: ' ' })
    value.push({ achievements: '' })
    res.achievements.forEach((a) => {
      const item = {}
      item[`placed ${a.place} in`] = a.event.name
      value.push(item)
    })
    return tableData
  } catch (e) {
    handleError(e)
  }
}

/**
 * log some info
 * @param data ,data source from the async functions above
 */
const dataToTable = (data: ITableData) => {
  if (!data) {
    log.error('no valid result')
    return
  }

  const table = data.value.reduce((result, current) => ((result.push(current), result)), new Table({ head: data.head }))
  log.default('\n')
  log.default(table.toString())
}

/**
 * high-order function, add log service for a function
 * @param fn , the origin function to wrap
 */
const logWrap = (fn: any) => async (name?: string) => {
  try {
    const tableData: ITableData = await fn(name)
    dataToTable(tableData)
  } catch (e) {
    handleError(e)
  }
}

export const printTeamMatches = logWrap(getTeamMatches)
export const printTeamOverview = logWrap(getTeamOverview)
export const printTeamRanking = logWrap(getTeamRanking)
export const printUpcomingMatches = logWrap(getUpcomingMatches)
export const printPlayer = logWrap(getPlayer)
export const printTeamPlayers = logWrap(getTeamPlayers)

export const printTeamMatchesTime = printTimeWrap(printTeamMatches)
export const printTeamOverviewTime = printTimeWrap(printTeamOverview)
export const printTeamRankingTime = printTimeWrap(printTeamRanking)
export const printUpcomingMatchesTime = printTimeWrap(printUpcomingMatches)
export const printPlayerTime = printTimeWrap(printPlayer)
export const printTeamPlayersTime = printTimeWrap(printTeamPlayers)
