// Writing — stories & essays. Same single-source-of-truth pattern as projects.ts:
// this file drives /writing (index) and /writing/[slug] (reading page).
// Prose strings use *asterisks* for italics; the page renders them with <em>.

export type StoryChapter = {
  title: string;
  /** Optional accent override for the chapter marker (defaults to rotating Mondrian primaries). */
  accent?: string;
  paragraphs: string[];
};

export type Story = {
  slug: string;
  title: string;
  part?: string;
  epigraph?: string;
  /** Display date, e.g. "July 2026" */
  date: string;
  minutes: number;
  summary: string;
  chapters: StoryChapter[];
  sign?: string;
  endnote?: string;
};

export const stories: Story[] = [
  {
    slug: "the-impossible-green",
    title: "The Impossible Green",
    part: "Part One",
    epigraph:
      "(names changed. everything else is true — that was the whole cost of it.)",
    date: "July 2026",
    minutes: 19,
    summary:
      "One afternoon, a door, an impossible green, and an email that hasn't been answered. A true story in eleven chapters.",
    sign: "— KALA",
    endnote: "(end of part one)",
    chapters: [
      {
        title: "The Door",
        paragraphs: [
          `I had come to my friend's house because I was low and he was kind, and those two things have arranged more afternoons in human history than love ever has.`,
          `An hour in — deep enough into the talk that I'd stopped performing being okay and was just okay — the door opened.`,
          `Here is what I want you to understand about doors. A door opens a hundred times a day and delivers nothing: a parent, a parcel, a draft of air. You never look. But some doors open the way a curtain does, and afterwards you divide your life into before it and after it, and the embarrassing part is you know this *while it's happening*, in real time, at seconds one, two, and three.`,
          `Second one: she is, optically, the first thing in her own doorframe. Work-tired — she had argued with the day all the way from the High Court and then brought herself home by metro. I should say here that I do not take the metro. I am a cab-and-auto person; the metro, with its walking and its noise and its entire population, defeats me. She had crossed the city underground and still arrived looking like this. Excited underneath the tired, the way a lamp is on underneath a cloth thrown over it.`,
          `Second two: an embroidered suit that somebody's grandmother would have called *wonder* and been correct.`,
          `Second three: our eyes meet, and stay met one beat past the legal limit. I have two degrees in science. I know what a second is. I am telling you it ran long.`,
          `Second four — and this is the second that ended me — she stepped into the room and opened her hair. Both at once, walking and loosening it, the way you only do in a house that is yours, in front of people who don't matter. Shining, heavy, down. I don't believe I blinked. The eye contact broke only because she shook her head to free the last of it, and physics did what I could not.`,
          `And then I stood up.`,
          `Not smoothly. I stood the way you stand when an elder enters the room — nervous, conscious, half-out-of-the-chair before the body has cleared the movement with the brain. I am thirty-nine years old. Her brother is thirty-four. She is younger than both of us. Nobody in that room required my respect in the standing-up format.`,
          `I stood up anyway. Some part of me had already decided something, and was rising to meet it.`,
        ],
      },
      {
        title: "The Question",
        paragraphs: [
          `Having stood, I now had to do something with the standing. What I did was open my mouth.`,
          `"So — what do you do?"`,
          `Understand: I knew what she did. Her brother had told me. More than once — Kabir and I had only met the year before, in Kodai, but the friendship had been through things; there is a long story involving the police that made us brothers faster than years would have, and it will be summarized never. I knew. The question was not a question. It was simply the noise my head made while all of its qualified departments were busy elsewhere.`,
          `She took it plainly — nothing special crossed her face, no arch look, none of the cinema I would be tempted to write onto her later. She was just going to answer it, the way you answer small questions from your brother's friends, and had gotten about as far as the inhale —`,
          `when Kabir jumped in. "She's a lawyer." Mildly surprised, the way you're surprised when a man asks you the way to his own house.`,
          `"Of course," I said, jumping in on top of him, so that now everyone in the room was answering the question except the person it was aimed at. "Of course — you told me. You've told me."`,
          `He had. And that is the whole afternoon in one line, if you want it early: everything I already knew, I was learning again from the beginning.`,
        ],
      },
      {
        title: "No Capitals",
        paragraphs: [
          `Since we had established, with three people's effort, that she was a lawyer, I did the only sensible thing a man in my position could do. I pitched her.`,
          `I told her I was designing a currency. An art currency — real one, denominations, exchange rate, the lot. I told her my AI had advised me to consult a lawyer, which was true, and which is the kind of sentence you could say out loud that year without anybody in the room finding it strange. And here she was. A lawyer. So — would she help me with the project?`,
          `"Yea, sure," she said.`,
          `Easily. The way you agree to things that will obviously never happen, or things that obviously will — the two are pronounced identically, and I have spent some weeks now on the phonetics.`,
          `Then, with all the smoothness of a man asking a bank for his own balance: "So... ahh — I get your email?"`,
          `She gave it. I typed it into WhatsApp and sent it to myself, which is the loneliest thing a phone can do and felt, that afternoon, like a heist pulled off in daylight.`,
          `"No capitals," she said.`,
          `Now. I hold two degrees in science. I know — the way I know my own name, which is relevant, wait — that email addresses have no capitals. There is no uppercase anywhere in that country. Every polished instinct I own leaned forward to say so. And for what may be the first time in my adult life, the machinery chose silence. I kept my eyes on the phone, typed her name in the lowercase it was born in, and survived the moment with what I am prepared to call grace.`,
          `What I said instead was: "I'm from a generation that didn't have to add numbers to its name."`,
          `Fact. Born '87 — when the internet arrived, I was standing at the door. My elder brother, who does not think of me much, thought of me exactly once and it counted: he reserved both our names, full and clean, addresses with long-lasting grace. Whatever else is true between my brother and me, there was a day he looked at the future and made sure my name had a seat in it.`,
          `She, being younger, carried a number: twenty-nine.`,
          `And this is where the two degrees really earn their fees — because I looked at that 29 and began, immediately, involuntarily, to decode it. Second of September? Twenty-ninth of something? A man who does not believe in energy, telepathy, or gods sat there doing numerology on a stranger's email address, and called it observation.`,
        ],
      },
      {
        title: "I Have Work",
        paragraphs: [
          `The afternoon settled into itself. A joint was traveling the room at the unhurried pace of a government file, and two or three hours passed that I would put, without embarrassment, on the shortlist of my life's best.`,
          `When it reached toward her, she declined. "I have work," she said — and said it while looking at Kabir, smiling cheekily, and that is the part I want entered into the record. The words were for the room. The look was for her brother. Some transmission passed between them on a frequency I could detect but not decode, and both of them briefly enjoyed something that neither of them explained.`,
          `I have no sister. I have a brother, five years up the road, and no frequency.`,
          `I told them so. Not gracefully — I complained, full power, the joint having loosened whatever usually supervises me. You two are so close, I said. Me and my brother are not. My brother does not carry me in his thoughts. I could email him with GOOD BYE in the subject line and the mail would sit there, unopened, holding its little flag.`,
          `Kabir considered this the way he considers things, which is briefly and then completely.`,
          `"Maybe because our age gap isn't much," he said.`,
          `Five years. That was his whole diagnosis, and the room moved on, and I have been sitting with it ever since. Five years — enough distance that one of you is always leaving a stage the other is just entering. Never in the same class, never in the same fights, never on the same side of the door. His sister looks at him and something crosses the gap in half a second, because for them there is barely a gap to cross.`,
          `At some point after that, she left the room.`,
          `I want to be precise here, because precision is all I have: I did not see her go. The man who had counted the seconds of her arrival, who had logged the suit, the hair, the head-shake, the phonetics of *yea sure* — that man looked up at some point and she was simply not there. No exit line, no doorframe moment. Houses that are yours let you vanish in them. It was the second thing she did that afternoon without any announcement, and I am realizing only now, writing it, that the door only opened loudly once.`,
        ],
      },
      {
        title: "(0,255,0)",
        accent: "rgb(0,255,0)",
        paragraphs: [
          `Kabir's food arrived from Zomato. There was food in the house — I want that noted, there was a whole kitchen operating in there, his sister was in it at that very moment, eating the food that existed — and this man had ordered outside food into a functioning home. Nobody remarked on it. Some households have solved larger contradictions.`,
          `The parents had left at some point, quietly, the way she did things. And Kabir said, come, we'll sit in the kitchen — and then, with no weight on it at all, the five most consequential words of my month: "Noor is also there."`,
          `She had changed.`,
          `I need my degrees back for this part. On a screen, there is a green you can summon by writing (0,255,0) — green turned all the way up with nothing else in the mixture, a green no leaf or parrot or traffic light has ever actually achieved, because nature always dilutes. Monitors are supposed to be the upper bound. That is the contract. And she sat there in the kitchen, in ordinary tube light, wearing it. I have two degrees in science and I am telling you the contract was broken in that kitchen. My bare eyes filed a complaint and then withdrew it.`,
          `We talked, the three of us, and this is where I watched her take her brother apart. Affectionately, expertly — leg-pulling as a discipline, and she practiced it like someone with formal training, which, it occurred to me, she had. Two degrees in law, one of them from London. Kabir stood no chance and knew it and didn't mind; that is what the missing age gap buys you.`,
          `And I sat there doing the arithmetic I had no business doing. Two degrees, one from London — her. Two degrees, one from London — me. Computer science and computational arts on my side of the table, law and more law on hers. Somewhere a bell went ting, ting, and I looked around the kitchen and nobody else had heard it, because it had rung, of course, nowhere.`,
        ],
      },
      {
        title: "Pass Order",
        paragraphs: [
          `At some point the kitchen dissolved, the way rooms do, one person at a time and nobody last. Kabir and I ended up in his bedroom, and then — and I want to describe this accurately, because although I have spent my whole life as a musician, an artist, and, sadly, a designer, I hold two degrees in science and they still audit my sentences — a telepathy occurred.`,
          `Neither of us said *balcony*. Neither of us said *there's still a little left*. There was a half-gesture, an eyebrow's worth of information, and we rose as one organism and moved toward the balcony with the leftover joint, in the manner of two men executing a plan neither had proposed. I do not believe in telepathy. I have said this already and I will keep saying it, with decreasing conviction, for the rest of this story.`,
          `I was pulling the jaali shut behind us when I saw it coming through the house: the green. Walking toward us with intent.`,
          `And I did the thing again — the elder thing. Swung the door open and held it with a formality the doorway had done nothing to deserve, and she walked past me into the balcony, and this time she made herself clear: she wanted in on the joint too. Work, apparently, had negotiated its terms.`,
          `Kabir lit it. Took his turn. And then passed it to me.`,
          `To *me*. With his sister standing right there.`,
          `I want it on record that I took offense visibly — that my face registered the protocol violation in real time — and I received the joint and turned and handed it directly to her, angry and falling in love in a single expression, which I would have told you was not anatomically possible and I now know takes no effort at all.`,
          `She took it. And she took *notice* — I am nearly sure. Something registered, was filed, secretly appreciated. Or nothing registered and I have built a cathedral on a raised eyebrow. Both readings remain open. The evidence, as always in this story, admits two interpretations pronounced identically.`,
          `It was only a little left. It finished. We went inside.`,
        ],
      },
      {
        title: "The Fan",
        paragraphs: [
          `Inside, the room fell into a gentle civic breakdown. Three stoned adults, four small decisions, no government.`,
          `She had taken the bed — comfortably, fully, glowing her impossible green against somebody's pillow — and asked Kabir for the fan. Kabir, who was standing, did not hear her. Kabir was occupied with the single-minded project of arriving at his chair. There was also an AC in the room, which introduced a constitutional question: I was mid-dilemma about whether to shut the jaali, because shutting it made sense if the AC was coming on, and the AC seemed like Kabir's jurisdiction, and Kabir was busy descending toward his chair with the focus of a landing aircraft. The AC never came on. The jaali question was never resolved. This is how afternoons actually work; films have been lying to us.`,
          `And the fan request was just sitting there, unanswered, in the middle of the room.`,
          `I was already seated, and far from the switchboard, and — the record should show — I did not want the fan. But I got angry for the second time that day on her behalf, the same low-voltage protocol anger from the balcony, and I told him, subtly, with the weariness of a man twice forced to enforce basic decency in this house: *Noor wants the fan.*`,
          `He dragged himself to the switchboard like it was the border. The fan came on. Justice, at ceiling height.`,
          `I don't know who was looking where in that room. I only know I was seeing her everywhere, which is not geometry, and I had stopped apologizing to myself about it.`,
          `And then she pulled her third disappearance — the boldest one, performed in plain sight. Somewhere between one sentence and another she stopped being a person in the conversation and became a beautiful girl asleep on the bed, probably born on the second of September. No announcement, naturally. It took me a long time to accept it, partly because I kept hoping the conversation would tempt her eyes back open, and partly out of plain disbelief — that anyone could drop into sleep in seconds, in a room containing her brother's bearded, stoned friend mid-sentence. I fall asleep the way committees reach decisions. She did it like a light going off.`,
          `Though I understood, even then, what it actually was. You sleep like that in a house that is yours, around people who are safe. I had been in the room for one afternoon and I was already furniture she could trust. There are worse things to be. I am still deciding whether there are better.`,
        ],
      },
      {
        title: "The Weather Report",
        paragraphs: [
          `At some point Kabir's phone pulled him into the drawing room — Meher, his fiancée then, his wife now, the reason a wedding was ten days out. And here the story arrives at its most honest scene, so let me not decorate it.`,
          `It took me a while to notice I was the only person awake in the room.`,
          `I know exactly how long, because the way I found out was this: I looked out of the window, and I made a remark about the weather. Out loud. Composed it, delivered it, gave it a beat to land. And it fell into the room the way a coin falls into a well that has no bottom — no splash, nothing. She was asleep. He was gone. I had just reviewed the sky for an audience of no one.`,
          `A man could feel stupid at such a moment, and I did, for the standard three seconds. But I was in love, and love does something obscene to embarrassment: it recycles it. Somewhere in me, the remark was reclassified from *humiliation* to *rehearsal*. The weather report would keep. There would be other rooms.`,
          `I strolled out, unhurried, a man leaving a theatre after everyone else. Found Kabir mid-call, mid-laugh, in the drawing room. And after some time I took my leave — wished him everything for the wedding I would not attend, and he came all the way down to see me off, because he is that kind of friend, the kind you find in Kodai with police assistance.`,
          `And then, at the cab — this is the part I keep — he mentioned wanting to gift Meher something. A portrait, he said.`,
          `Or I said.`,
          `I genuinely cannot tell you which of us said it, and I no longer want to know. The cab was already moving. The whole agreement happened between our eyes in about half a second — *you'll make it, of course I'll make it, of course you will* — the second telepathy of the afternoon, executed through glass and traffic. I don't believe in telepathy. The conviction, as promised, keeps decreasing.`,
          `I rode home through the rain with every bell in my head ringing. I carried the whole day into the house like a full glass of water, careful on the stairs, spilling nothing, and set it down next to my bed, where — a man of science reports this against his own interests — it hummed all night with something I am contractually unable to call energy.`,
        ],
      },
      {
        title: "Too Much Is Too Less",
        paragraphs: [
          `The next evening there was a gig — Karsh Kale at the Taj, which is a sentence that costs more than it says — and I came to collect Kabir. I would have waited downstairs. Waiting downstairs is what cabs and I do. But he insisted, come up, come all ten floors up — and then added, with no idea what he was doing to me, "no one is here."`,
          `I went up anyway. Let the record show the honesty: I went up hoping the intelligence was wrong.`,
          `The door opened. It was his father.`,
          `Now — the same door. I want you to hold that. The same door that had opened two weeks into this story and rearranged me. Doors in that house apparently do not know how to open uneventfully.`,
          `He smiled very calmly, the way men smile when they have finished being in a hurry for good. I said, you're seeing too much of me, I know.`,
          `And he said: "Too much is too less."`,
          `Bent down a little as he said it. Held the moment. Owned it, fully, a man collecting rent on half a second. I have been writing sentences all my life in three disciplines and I have never landed one like that at my own front door.`,
          `What followed was the most detailed, spot-on conversation I can remember having — his life story and mine, not told one after the other but intertwining, plaited, his Banaras answering my boyhood, my music answering his. Somewhere in the middle Kabir appeared in a bathrobe, stood for a moment like a man assessing weather, and left. "He doesn't like conversations with me," his father remarked, with the cheerful slander only family is licensed to produce. Then Kabir returned in gig clothes and joined, and the three of us went wherever it is that talk about classical music, art, boyhood, and Rahman goes when it's going well.`,
          `I sat in that drawing room and understood the thing I would keep misfiling as being about her. I had fallen for a girl in impossible green, yes. But I had also fallen for a house. A house where the father lands sentences, the son summons you ten floors just to have you nearer, and the daughter falls asleep mid-room because everyone in it is safe.`,
          `And let me be careful here, because my own family is tight, and this story will not pretend otherwise — a mother whose late-night ping is a lighthouse doing its job, a brother with whom the ledger is long, both columns full, and nowhere near closed. It wasn't that their house had something mine lacked. It was that their house ran on that one particular frequency — the no-gap one, the half-second sibling channel Kabir had diagnosed in five words — and I had spent two afternoons listening to it the way you listen to a language you understand but have never been fluent in.`,
        ],
      },
      {
        title: "Wrong Cast",
        paragraphs: [
          `The gig was good. I want to be fair to the gig.`,
          `Karsh Kale at the Taj, luxury out of my ass, a night full of sound and people — we met a bunch of them, the way you do, faces arriving and dissolving. Kabir was easy company, the way he is. The night did everything a night is supposed to do.`,
          `But I watched it all from one seat back inside myself, because the night had been perfectly produced and, in my private review, miscast. There was a version of the evening I had been secretly running since the previous afternoon — same venue, same music, one additional attendee — and no quantity of tabla or Taj was going to out-perform a rumor I had made up myself. She had never been part of the plan. I knew that. Hoping is not knowing's problem.`,
          `And I could hear how it sounded, even then, even from inside it. A thirty-nine-year-old man — KALA, if you please, the artist name still fits, though some nights it hangs looser than others — in love on the strength of one afternoon, two hours of which his heroine had spent asleep. Sleeping beauty, and the fool didn't even have a kingdom to offer, just an art currency he hadn't finished inventing. I knew the arithmetic. Early thirties at best, her. Thirty-nine, me, and counting. The heart did the sums, got the same answer as the head, and simply declined to accept delivery.`,
          `Afterwards we went back up the ten floors, and at some absurd hour — three in the morning, the hour with no witnesses — we smoked another joint, and the night finally sat down. Somewhere in there my phone lit up: mummy. A ping across the city, on time as always, the lighthouse confirming the coastline was where I'd left it. Loved, located, expected home.`,
          `I took my leave. Wedding in a week. I would not be there, but my portrait would be commissioned, my friend was happy, and the door — I noted on the way out, against all my degrees — did not open.`,
        ],
      },
      {
        title: "The Second Clause",
        paragraphs: [
          `The wedding happened without me, in another town, on the twenty-second. They came back on the twenty-fourth or twenty-fifth. I know because I was keeping the calendar the way I once kept seconds at a door — and because I had already chosen my date. The first Monday after they were home, I would write to her. Not during the wedding; I was clear about that. You do not hand a woman anything extra to carry while she is carrying her brother's wedding.`,
          `So on Monday I wrote the email, and I did the only thing I know how to do with a woman that sharp: I disarmed myself at the door. I told her the mail had a pretext and a real reason, and that she was far too sharp for me to pretend otherwise. The pretext, fully legitimate: an artist inventing a currency eventually needs a very good lawyer. The real reason: that I hadn't laughed like that in longer than I could remember, and I was looking for a way to spend time with her that didn't require her brother to host me. And then the closing clause, which I will quote exactly, because I earned it: *You're a lawyer — I trust you to spot which clause carries more weight.*`,
          `I pressed send. Subject line: "A small legal matter." A machine somewhere read those words and filed them wherever machines file the heart's paperwork.`,
          `That was nine days ago.`,
          `Nine days of a silence I have checked on with steadily decreasing dignity. And I have had to sit with the thing the whole afternoon had been teaching me and I had refused to learn: in that house, everything important happens without announcement. She entered my story mid-frame with no warning. She left rooms without a word. She fell asleep between two sentences. Silence *is* her family's grammar — and silence, I am forced to note as a matter of law, is also a reading. Maybe she spotted the clause, weighed it, and returned her verdict in her native language. Maybe the email sits unopened in a folder built by an algorithm that also doesn't believe in love. Both remain possible. Both, as always in this story, are pronounced identically.`,
          `There have been tears this week. Day-long ones, parent-proof ones, held at the border all day and released only after lights-off, and I record them here the way I recorded the seconds at the door — because precision is all I have, and pretending is expensive.`,
          `But here is what else remains on the books, because I am, among my other degrees, an accountant of strange currencies. One unfinished economy, still owed its lawyer. One portrait, promised across a moving cab in half a second of telepathy I officially don't believe in — a debt, and debts are tethers; you stay findable when you owe a friend art. One weather report, composed, delivered once to a sleeping room, still fresh, still unspent. And one email, out there, which no reply can unmake: proof on some server, permanent as scripture, that at thirty-nine, low, unfamous, and fluent in nothing but wonder — I was still capable of walking up to the most beautiful thing in the room and telling it the truth in two clauses.`,
          `A currency, when you strip away all my code and mechanics, is only this: a promise the future agrees to honor. So I am issuing one, here, on the last page, in my own denomination.`,
          `This story has a part two. I do not know its cast. I do not know if the green appears in it, or the reply, or an entirely different door. But a promissory note requires its issuer to exist on the date of maturity — that is the whole instrument, that is the law of it, ask any lawyer.`,
          `The author will be there. It is the only clause in this story that carries no pretext at all.`,
        ],
      },
    ],
  },
];

export const getStory = (slug: string) => stories.find((s) => s.slug === slug);
