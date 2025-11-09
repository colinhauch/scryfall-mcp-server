# Scryfall Search Syntax - Complete Reference

This document provides comprehensive documentation for constructing Scryfall search queries. For quick reference with common patterns, see the search_cards tool description.

## Basic Search Categories

### Card Names
- **Loose search**: Just type the card name: `lightning bolt`
- **Exact match**: Prefix with `!`: `!fire` (finds only the card named "Fire")
- **Name keyword**: `name:bolt` or `name:"dark ritual"`
- **Negation**: `-name:dragon` (exclude cards with "dragon" in name)

### Colors and Color Identity
- **Keywords**: `c:` or `color:` for card colors; `id:` or `identity:` for color identity
- **Values**: Full names (`blue`, `red`) or letters (`w`, `u`, `b`, `r`, `g`)
- **Color combinations**:
  - Multi-color shorthand: `c:uw` (blue and white), `c:rgb` (red, green, blue)
  - Guild names: `c:azorius`, `c:golgari`, `c:izzet`
  - Shard names: `c:bant`, `c:esper`, `c:grixis`, `c:jund`, `c:naya`
  - Wedge names: `c:abzan`, `c:jeskai`, `c:mardu`, `c:sultai`, `c:temur`
- **Comparison operators**: `c>2` (more than 2 colors), `c<=1` (1 or fewer colors), `c:colorless`
- **Examples**:
  - `c:rg` - Red and green cards
  - `c>=3` - Cards with 3 or more colors
  - `id:wubrg` - Five-color identity (for Commander)

### Card Types
- **Keyword**: `t:` or `type:`
- **Scope**: Searches supertypes, card types, and subtypes
- **Partial matching**: `t:legend` finds "Legendary"
- **Multiple types**: `t:legendary t:creature` (both must match)
- **Negation**: `-t:creature` or `not:creature`
- **Examples**:
  - `t:instant` - All instant cards
  - `t:"legendary creature"` - Legendary creatures
  - `t:elf t:warrior` - Elf Warriors
  - `t:artifact t:creature` - Artifact creatures

### Card Text (Oracle Text)
- **Keywords**:
  - `o:` or `oracle:` - Current oracle text (excludes reminder text)
  - `fo:` or `fulloracle:` - Includes reminder text
- **Wildcards**: `~` represents the card's own name
- **Quotes**: Use quotes for phrases with spaces or punctuation
- **Keyword abilities**: `keyword:` or `kw:` - `kw:flying`, `kw:trample`
- **Examples**:
  - `o:"draw a card"` - Cards that draw cards
  - `o:"~ enters the battlefield"` - Cards with ETB effects
  - `o:flying o:vigilance` - Cards with both abilities
  - `kw:hexproof kw:indestructible` - Cards with both keywords

### Mana Costs and Mana Value
- **Mana cost**: `m:` or `mana:`
  - Format: Use Comprehensive Rules notation: `{2}{W}{W}` or simplified `2ww`
  - Symbols: `W` (white), `U` (blue), `B` (black), `R` (red), `G` (green)
  - Special: `X`, `C` (colorless), `S` (snow)
- **Mana value** (formerly CMC): `mv:`, `manavalue:`, or `cmc:`
  - Operators: `mv=3`, `mv<=2`, `mv>=7`, `mv>4`
- **Special mana types**:
  - `is:hybrid` - Contains hybrid mana
  - `is:phyrexian` - Contains Phyrexian mana
  - `is:split` - Split cards
- **Examples**:
  - `m:2ww` - Costs exactly {2}{W}{W}
  - `mv<=2 c:blue` - Blue cards costing 2 or less
  - `is:hybrid c:rg` - Red/green hybrid cards

### Power, Toughness, and Loyalty
- **Keywords**:
  - `pow:` or `power:` - Creature power
  - `tou:` or `toughness:` - Creature toughness
  - `pt:` or `powtou:` - Search both (e.g., `pt:3/3`)
  - `loy:` or `loyalty:` - Planeswalker starting loyalty
- **Operators**: All numeric comparisons (`=`, `>`, `<`, `>=`, `<=`, `!=`)
- **Cross-comparisons**: `pow>tou` (power exceeds toughness)
- **Examples**:
  - `pow>=5 t:creature` - Creatures with power 5 or greater
  - `tou>pow c:white` - White creatures with toughness greater than power
  - `pt:2/2` - Creatures with exactly 2/2
  - `loy>=5` - Planeswalkers starting with 5+ loyalty

### Multi-Faced Cards
- **Card types**:
  - `is:split` - Split cards (e.g., Fire // Ice)
  - `is:flip` - Flip cards (e.g., Nezumi Graverobber)
  - `is:transform` - Transform cards (e.g., Delver of Secrets)
  - `is:meld` - Meld cards (e.g., Bruna, the Fading Light)
  - `is:mdfc` - Modal double-faced cards
  - `is:dfc` - Any double-faced card
  - `is:leveler` - Level up cards
- **Example**: `is:transform t:werewolf`

## Advanced Filters

### Rarity
- **Keyword**: `r:` or `rarity:`
- **Values**: `common`, `uncommon`, `rare`, `mythic`, `special`, `bonus`
- **Operators**: `r>=rare` (rare or mythic), `r<=uncommon` (common or uncommon)
- **First printings**: `new:rarity` - Cards where this is their first rarity
- **Ever printed at**: `in:rare` - Cards ever printed at rare
- **Examples**:
  - `r:mythic c:red` - Mythic rare red cards
  - `r>=rare f:standard` - Standard-legal rares and mythics

### Sets and Editions
- **Set code**: `s:`, `e:`, `set:`, or `edition:` (e.g., `s:war`, `e:mkm`)
- **Set name**: Use quotes for full names: `set:"War of the Spark"`
- **Collector number**: `cn:` or `number:` - `cn:123`, `cn>=200`
- **Block**: `b:` or `block:` - `b:ktk` (Khans of Tarkir block)
- **Set type**: `st:`
  - Values: `core`, `expansion`, `masters`, `commander`, `draft_innovation`, `funny`, etc.
  - Example: `st:masters` (all Masters sets)
- **Promo types**: `is:booster`, `is:prerelease`, `is:fnm`, `is:release`, `is:promo`
- **Examples**:
  - `s:neo r:mythic` - Mythic rares from Kamigawa: Neon Dynasty
  - `cn>=300 s:war` - War of the Spark cards with collector number 300+
  - `st:commander` - Cards from Commander products

### Format Legality
- **Legal in format**: `f:` or `format:`
  - Formats: `standard`, `historic`, `explorer`, `pioneer`, `modern`, `legacy`, `vintage`, `pauper`, `commander`, `brawl`, `duel`, `oldschool`, `premodern`
  - Example: `f:standard`, `f:commander`
- **Banned/Restricted**: `banned:` and `restricted:`
  - Example: `banned:modern`, `restricted:vintage`
- **Commander eligibility**:
  - `is:commander` - Can be your commander
  - `is:brawler` - Can be your Brawl commander
  - `is:companion` - Can be your companion
- **Examples**:
  - `f:standard t:creature` - Standard-legal creatures
  - `banned:modern c:green` - Green cards banned in Modern
  - `is:commander id:uw` - Azorius commanders

### Pricing
- **Keywords**: `usd`, `eur`, `tix` (MTGO tickets)
- **Operators**: All numeric comparisons
- **Cheapest versions**: `cheapest:usd`, `cheapest:eur`, `cheapest:tix`
- **Examples**:
  - `usd<1 r:rare` - Rares under $1
  - `tix>=50` - Cards worth 50+ MTGO tickets
  - `cheapest:usd<=5 f:commander` - Commander-legal cards with cheapest printing under $5

### Artist, Flavor Text, and Watermarks
- **Artist**: `a:` or `artist:`
  - Detects multiple artists automatically
  - Example: `a:"Rebecca Guay"`, `a:nielsen`
- **Flavor text**: `ft:` or `flavor:`
  - Example: `ft:elves`, `ft:"the fire"`
- **Watermarks**: `wm:` or `watermark:`
  - Example: `wm:azorius`, `wm:phyrexian`
  - Has watermark: `has:watermark`
- **New properties**:
  - `new:art` - First time this art appears
  - `new:artist` - First time by this artist
  - `new:flavor` - First time with this flavor text

### Frame, Border, and Appearance
- **Border color**: `border:`
  - Values: `black`, `white`, `silver`, `borderless`, `gold`
  - Example: `border:borderless`
- **Frame edition**: `frame:`
  - Values: `1993`, `1997`, `2003`, `2015`, `future`
  - Special: `legendary`, `colorshifted`, `extendedart`, `showcase`
  - Example: `frame:2015`, `frame:showcase`
- **Foil availability**:
  - `is:foil` - Available in foil
  - `is:nonfoil` - Available in non-foil
  - `is:etched` - Etched foil
  - `is:glossy` - Glossy finish
- **Image quality**: `is:hires` - High-resolution scan available
- **Security stamps**: `stamp:`
  - Values: `oval`, `acorn`, `triangle`, `arena`
  - Example: `stamp:acorn` (playtest/Un- cards)

### Games and Availability
- **Game platform**: `game:`
  - Values: `paper`, `mtgo`, `arena`
  - Example: `game:paper`, `game:arena`
- **Availability**: `in:`
  - Values: `paper`, `mtgo`, `arena`
  - Example: `in:arena` (available on Arena)
- **Digital-only**: `is:digital` - Only exists digitally
- **Special cards**:
  - `is:promo` - Promotional printing
  - `is:spotlight` - Scryfall spotlight card
  - `is:scryfallpreview` - Previewed by Scryfall

### Year and Release Date
- **Year**: `year:` with operators
  - Example: `year=2023`, `year>=2020`, `year<2010`
- **Date**: `date:` with operators
  - Format: `yyyy-mm-dd`
  - Example: `date>=2023-01-01`, `date<2022-12-31`
- **Set-relative dates**:
  - Use set codes as dates: `date>war` (after War of the Spark)

### Reprints and Print Counts
- **Reprint status**:
  - `is:reprint` - Reprinted card
  - `not:reprint` - Original printing only
  - `is:unique` - Never been reprinted
- **Print counts**:
  - `prints=1` - Exactly one printing
  - `sets=1` - Printed in exactly one set
  - `paperprints=1` - One paper printing
  - `papersets=1` - One paper set
  - Operators: `>=`, `>`, `=`, `<`, `<=`
- **Examples**:
  - `prints=1 r:mythic` - Mythics printed only once
  - `is:reprint s:mkm` - Reprints in Murders at Karlov Manor

### Language
- **Keyword**: `lang:` or `language:`
- **Values**: ISO language codes (`en`, `ja`, `fr`, `de`, `es`, `it`, `pt`, `ko`, `ru`, `zhs`, `zht`)
- **Any language**: `lang:any`
- **First in language**: `new:language`
- **Example**: `lang:ja`, `lang:any name:"Lightning Bolt"`

### Spell Types and Properties
- **Spell types**:
  - `is:spell` - Can be cast as a spell
  - `is:permanent` - Remains on battlefield
- **Mechanical categories**:
  - `is:historic` - Artifact, legendary, or Saga
  - `is:party` - Cleric, Rogue, Warrior, or Wizard
  - `is:modal` - Has modes/choices
  - `is:vanilla` - No rules text
  - `is:frenchvanilla` - Only keyword abilities
  - `is:bear` - 2/2 creature for {1}{G}

## Query Operators and Mechanics

### Negation
- **Method 1**: Prefix with hyphen: `-t:creature`, `-c:blue`
- **Method 2**: Use `not:`: `not:reprint`, `not:spell`
- **Word negation**: `-lightning` (exclude cards with "lightning" in name)
- **Example**: `t:instant -c:blue f:standard` (Standard non-blue instants)

### Boolean Logic
- **AND (default)**: Terms are combined automatically
  - Example: `t:creature c:red pow>=4` (all conditions must match)
- **OR**: Use the word `or` or `OR`
  - Example: `t:elf or t:goblin`
  - Example: `c:red or c:blue`
- **Grouping**: Use parentheses `( )` for complex logic
  - Example: `t:legendary (t:elf or t:goblin)`
  - Example: `(c:red or c:blue) (t:instant or t:sorcery)`
- **Complex example**: `t:creature (c:red or c:green) (pow>=5 or tou>=5) f:modern`

### Regular Expressions
- **Activation**: Use `//` instead of quotes
- **Supported keywords**: `name`, `type`, `oracle`, `flavor`
- **Syntax**:
  - Wildcards: `.*` (any characters), `.` (any single character)
  - Options: `(a|b)` (a or b)
  - Brackets: `[abc]` (any of a, b, c)
  - Character classes: `\d` (digit), `\w` (word), `\s` (space)
  - Quantifiers: `+` (one or more), `*` (zero or more), `?` (optional)
  - Anchors: `^` (start), `$` (end)
- **Escaping**: Use `\/` for forward slashes in pattern
- **Examples**:
  - `name:/.*bolt$/` - Names ending in "bolt"
  - `o:/draw (\d+) cards?/` - Draw X cards effects
  - `t:/elf.*(warrior|scout)/` - Elf Warriors or Scouts

### Exact Matching
- **Method**: Prefix word with `!`
- **Behavior**: Case-insensitive exact name match
- **Example**: `!fire` (returns only "Fire", not "Fireball" or "Fire // Ice")

## Display and Organization Options

### Uniqueness Strategies
- **Parameter**: `unique:`
- **Values**:
  - `unique:cards` (default) - One result per card
  - `unique:prints` - Show every printing
  - `unique:art` - Show each distinct illustration
- **Example**: `lightning bolt unique:prints` (all Lightning Bolt printings)

### Result Display Format
- **Parameter**: `display:`
- **Values**:
  - `display:grid` - Visual grid layout
  - `display:checklist` - Text checklist format
  - `display:full` - Full card details
  - `display:text` - Text-only format

### Sorting
- **Parameter**: `order:`
- **Values**: `name`, `set`, `released`, `rarity`, `color`, `usd`, `tix`, `eur`, `cmc`, `power`, `toughness`, `edhrec`, `penny`, `review`
- **Direction**: `direction:asc` or `direction:desc`
- **Example**: `t:creature order:power direction:desc` (creatures by power, highest first)

### Printing Preferences
- **Temporal**: `prefer:oldest`, `prefer:newest`
- **Price-based**: `prefer:usd-low`, `prefer:usd-high` (also `tix`, `eur`)
- **Promotional**: `prefer:promo` - Show promo versions first
- **Example**: `t:creature prefer:oldest` (show oldest printing of each creature)

## Notable Shortcuts and Special Filters

### Land Type Shortcuts
- `is:bikeland` - Bicycle lands (basic land types, ETB tapped unless two+ basics)
- `is:bounceland` - Karoo lands (return a land, tap for two)
- `is:checkland` - Check lands (ETB untapped if you control a land type)
- `is:dual` - Original dual lands (two basic land types, no drawback)
- `is:fetchland` - Fetch lands (pay life, search for land types)
- `is:gainland` - Gain lands (ETB tapped, gain 1 life)
- `is:filterland` - Filter lands (convert one color into two)
- `is:painland` - Pain lands (tap for colorless or pay 1 life for color)
- `is:scryland` - Scry lands (ETB tapped, scry 1)
- `is:shockland` - Shock lands (two basic types, pay 2 life or ETB tapped)
- `is:storageland` - Storage lands (store mana with counters)
- `is:tangoland` - Battle lands (two basic types, ETB untapped if two+ basics)
- `is:triland` - Tri-lands (three colors, ETB tapped)
- `is:fastland` - Fast lands (ETB untapped if you control two or fewer lands)
- `is:slowland` - Slow lands (ETB tapped unless you control two or fewer lands)

### Special Card Categories
- `is:masterpiece` - Masterpiece Series cards
- `is:colorshifted` - Color-shifted (Planar Chaos) cards
- `is:timeshifted` - Time Spiral timeshifted cards
- `is:futureshifted` - Future Sight futureshifted cards
- `is:reserved` - Reserved List cards
- `is:booster` - Available in booster packs
- `is:funny` - Un-set and other humorous cards
- `is:full` - Full-art cards

## Complex Query Examples

### Commander Deck Building
```
// Find card draw in Simic colors
o:"draw" id:ug f:commander cmc<=4

// Azorius removal
(o:exile or o:destroy) id:wu t:instant f:commander

// Gruul ramp creatures
o:"search your library for a land" t:creature id:rg
```

### Budget Standard Deck
```
// Aggressive red creatures under $1
t:creature c:red pow>=2 cmc<=3 f:standard usd<1

// Card advantage under $2
o:"draw" f:standard usd<2 (t:instant or t:sorcery)
```

### Cube Design
```
// Iconic creatures for each color
t:creature (c:w or c:u or c:b or c:r or c:g) r>=rare pow>=4

// Mono-red removal
c:r (o:damage or o:destroy) (t:instant or t:sorcery) not:reprint
```

### Collection Management
```
// Expensive cards from recent sets
date>=2023-01-01 usd>=10 r:mythic

// Cards available on Arena but not yet in paper
in:arena -in:paper

// Cards with new art in recent Masters sets
st:masters year>=2022 new:art
```

### Format Staples
```
// Modern burn spells
f:modern (o:"deals damage" or o:"deals 3 damage") c:r (t:instant or t:sorcery) cmc<=2

// Pauper control finishers
f:pauper r:common c:u (t:creature or t:instant) cmc>=5

// Commander board wipes under $5
f:commander o:"destroy all" usd<5
```

## Tips for Effective Searching

1. **Start broad, then narrow**: Begin with basic filters and add more as needed
2. **Use quotes for phrases**: `o:"enter the battlefield"` not `o:enter the battlefield`
3. **Combine complementary filters**: Mix type, color, and text searches
4. **Use OR for alternatives**: `(t:elf or t:goblin)` for tribal choices
5. **Leverage format filters early**: `f:standard` reduces result set immediately
6. **Check card faces**: Multi-faced cards match if either face matches
7. **Test incrementally**: Build complex queries step by step
8. **Use regex for patterns**: When exact text varies slightly
9. **Remember operator precedence**: Parentheses for explicit grouping
10. **Save complex queries**: Bookmark or save frequently used searches

## Reference: Color Abbreviations

- `w` = White
- `u` = Blue
- `b` = Black
- `r` = Red
- `g` = Green
- `c` = Colorless (when used alone)

## Reference: Common Keywords

Full list of searchable keywords via `kw:`: Flying, First strike, Double strike, Deathtouch, Haste, Hexproof, Indestructible, Lifelink, Menace, Reach, Trample, Vigilance, Defender, Flash, Ward, Prowess, and many more.

For the most up-to-date and complete documentation, visit: https://scryfall.com/docs/syntax
