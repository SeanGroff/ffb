import puppeteer from 'puppeteer'
import type { NextApiRequest, NextApiResponse } from 'next'

// type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF'

type Player = {
  name: string
  position: string // TODO: Fix Position Type
  rank: number
  tier: number
  bye: number
}

type Data = {
  players: Player[]
}

type Scoring = 'consensus' | 'ppr' | 'half-point-ppr'

const BASE_RANKINGS_URL = 'https://www.fantasypros.com/nfl/rankings'

async function scraper(scoring: Scoring): Promise<Player[]> {

  const url = `${BASE_RANKINGS_URL}/${scoring}-cheatsheets.php`
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.goto(url, { waitUntil: 'networkidle2' })
  const data = await page.evaluate(() => {
    let currentTier = 0
    let players: Player[] = []

    const table = document.querySelector('#ranking-table > tbody')
    const rows = table?.querySelectorAll('tr')

    rows?.forEach((row) => {
      // Check if Tier Row
      const tier = row.getAttribute('data-tier')
      if (tier) {
          currentTier = Number(tier.trim())
      } else {
        const rank = row.querySelector<HTMLElement>('td:nth-child(1)')?.innerText
        const name = row.querySelector<HTMLElement>('td:nth-child(3) > div > a')?.innerText
        // TODO: Fix K and DEF not parsing correctly
        const position = row.querySelector<HTMLElement>('td:nth-child(4)')?.innerText.substring(0, 2).toUpperCase()
        const bye = row.querySelector<HTMLElement>('td:nth-child(5)')?.innerText
        if (name && position && rank && currentTier && bye) {
          players.push({
            name: name.trim(),
            position: position.trim(),
            rank: Number(rank.trim()),
            tier: currentTier,
            bye: Number(bye.trim())
          })
        }
      }
    })

    return players
  })

  await browser.close()

  return data
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'POST':
      const players = await scraper('half-point-ppr')
      res.status(200).json({players})
      break;
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
