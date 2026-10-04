# RALPH Operating Thesis Voice Note — 2026-07-01

Source audio: `raw/assets/voice-notes/2026-07-01-ralph-operating-thesis.ogg`

This is a machine-generated Czech transcript from Tomas's Telegram voice note. It is imperfect, but the intent is clear enough to treat it as source material for RALPH.

## Transcript

Hele, poznámky máš prostě ten second brain. Je na to dobrej jako operační systém, myslím. Ty poznámky jako brain můžeš dát do toho. A můžeš si i nadefinovat smyčky, které v tom second brainu pojedou. A bude to vlastně rozvíjet ten projekt jako takový.

Já nevím, co to je. Je to nějaký trading bot, ale jsou to spíše části toho trading bota. Ty je musíš vlastně postupně stavět, aby to dávalo smysl na nějaký ucelený trading bot systém. Benchmarky jsou vlastně úplně mimo to. Ten s tím až tak nesouvisí, spíš je to příklad, jak se benchmark dělal pro nějaký typ strategie. Problém je, že každý trading bot má nějakou strategii a tu my nevíme. Takže my musíme zjistit tu strategii. Ale když nevíš strategii, tak podle mě ani nevíš, jak máš nadesignovat cokoliv ohledně trading bot systému.

Když se podíváš na MEV bot workspace, tam jsem šel spíš k něčemu, k nějakému botovi, který se triggeruje, když bitcoin nebo crypto jde fakt hodně. Když jsou pohyby velké, je tam větší prostor být potenciálně profitable. Trading bot, který nestojí 10 000 dolarů a neběží na nejrychlejší infrastruktuře, je spíš průměrný. Nevím, kam se to kapitálově může hnout, ale moc peněz nemám. Infra měsíčně maximálně 100-200 dolarů, spíš 100. Tady se nebavíme ani tolik o investovaném kapitálu, ale aby to vůbec bylo profitable. Dokud není, musíme simulovat, simulovat, simulovat, hrabat se v tom, iterovat loops a research, dokud neobjevíme strategii, která by mohla dávat smysl vzhledem k budgetu.

Trading bot se nemusí triggerovat furt. Nevím, jestli je jednodušší designovat systém, který dělá transakce často, nebo systém, který je dělá jednou za hodně dlouhou dobu, ale je tam větší pravděpodobnost profitu, když se děje event, na který trading bot reaguje. Třeba velký pohyb na bitcoinu, na který reaguje celé crypto. Pak vzniká víc prostoru pro víc market participants profitovat. Když pohyby nejsou velké, našeho trading bota může někdo využít nebo zneužít přes orderflow, front-running nebo sandwiching. Proto nemůžeme dělat nic na Solaně jako normální bot, protože Solana je tak kompetitivní, že to pravděpodobně nedáme. Spíš EVM, ale nevím které.

Proto chci ten second brain, ten RALPH. RALPH je něco, co běží a vlastně failuje. Dokud failuje, jede dál. Chci, aby RALPH loopil normálně na cron, nebo když failuje, tak znovu, dokud nebudeme mít nějaký relevantní výsledek. Nevím ještě relevantní vzhledem k čemu, ale poznáme, že to vedlo k něčemu. Vedlo to k wallet shadowingu, což je jednodušší strategie, a v kombinaci s tím, že pohyby jsou velké na bitcoinu, vzniká prostor, kdy může být bot profitable. Spárované s wallet shadowingem je to jediné, co mě napadá.

Chci, aby ses z toho research brainu nadesignoval ty loops. Nejdřív bys měl udělat obrovský research na frameworky na trading boty, GitHub repozitáře, relevantní discovery, research a simulace. Mělo by to celé běžet v loopu, ne abych do toho musel pořád chodit. Co nejvíc automatizované, ale chápu, že všechno nejde automatizovat a že může vznikat slop, když do toho nezasáhnu.

Chci, abys dělal i skills. Máš skill creator k dispozici. Na základě loops, ať už failnou nebo jsou successful, vždycky vygenerovat nějaký skill. Chci, aby sis to celé stavěl sám, abys na tom měl ownership. Když mě s něčím instruuješ, co mám dělat já, tak mezi tím by měly běžet na pozadí nějaké loops.

Proto jsem posílal AI Research OS: aby sis to přečetl, nainstaloval, navázal na všechny tři workspaces, ale primárně RALPH, protože RALPH je ten AI Research OS. Je tam i Obsidian/wiki, kde může být memory.

MEV bot skončil u wallet shadowingu v kombinaci s tím, že se triggeruje na základě volatility a velkých moves. Chci ale research i trading bot strategií, trading bot systémů, jak fungují, jaké jsou operace, jak se kombinují, co běží sekvenčně nebo paralelně, a jak na sebe navazují. Já nevím, jak to má vypadat, proto chci ten research. Může to vést k relevantnímu designu systému, nebo k tomu, že se něco okopíruje / inspiruje z public trading bot repo, GitHubu, Twitteru nebo zmínek.

Chci, aby GitHub research a Twitter research běžel na pozadí furt. Chci k tomu denní watcher, který kouká, co se děje na marketu. Když jsou velké moves, je to input do trading bot systému, který na to reaguje nějakou sekvencí kroků a operací. Jsou tam podmínky, kdy se jedno kolečko spustí a pak se rozjede druhé a třetí, nebo běží paralelně. Já o tom vím málo, ale chtěl bych nějaký trading bot postavit, aby byl profitable. Tak si dej milestone sám sobě a začni pracovat.

