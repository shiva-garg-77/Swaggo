'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Phone, Video, MoreVertical, Smile, Paperclip, Mic, MicOff, 
  Image, FileText, Heart, Reply, Copy, Forward, Trash2, Download, 
  Volume2, Pause, Play, Camera, Gift, Zap, MessageCircle, Share2, 
  Eye, EyeOff, Shield, Settings, Search, Plus, Users, Bell, 
  Palette, Type, Moon, Sun, Translate, Bot, Pin, Archive, 
  Mute, Block, Flag, X, ChevronDown, ChevronUp, RotateCcw,
  Clock, Check, CheckCheck, Headphones, Monitor, Filter,
  Lock, Unlock, AlertTriangle, Star, Bookmark, Edit3,
  Scissors, PaintBucket, Layers, Maximize, Minimize,
  SkipBack, SkipForward, Repeat, Shuffle, VolumeX
} from 'lucide-react';
import { useTheme } from '../Helper/ThemeProvider';

// Emoji categories and data
const EMOJI_CATEGORIES = {
  recent: { icon: '🕐', emojis: ['😊', '❤️', '👍', '😂', '😢', '😮', '🎉', '😍', '👋', '🔥'] },
  smileys: { icon: '😊', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'] },
  people: { icon: '👋', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋'] },
  nature: { icon: '🌳', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦣', '🦏', '🦛', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎', '🌍', '🌏', '🪐', '💫', '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🔥', '🌪️', '🌈', '☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '💧', '💦', '☔', '☂️', '🌊', '🌫️'] },
  food: { icon: '🍕', emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾'] },
  activities: { icon: '⚽', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🏇', '🧘', '🏄', '🏊', '🚴', '🚵', '🧗', '🤾', '🏌️', '🏃', '🚶', '🧑‍🦯', '🧑‍🦼', '🧑‍🦽'] },
  travel: { icon: '✈️', emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚦', '🚥', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍', '🛕', '🕋'] },
  objects: { icon: '💡', emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪓', '🪚', '🔩', '⚙️', '🪤', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪣', '🧽', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛏️', '🛋️', '🪞', '🚿', '🛁', '🚽', '🪠', '🧻', '🪒', '🧼', '🪥', '🧹', '🧺', '🧷', '🧶', '🧵', '🪡', '🧥', '🥼', '🦺', '👔', '👕', '👖', '🩲', '🩳', '👗', '👘', '🥻', '🩱', '👙', '👚', '👛', '👜', '👝', '🛍️', '🎒', '🩴', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓', '🧢', '🪖', '⛑️', '📿', '💄', '💍', '💎'] },
  symbols: { icon: '❤️', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧️', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '🟰', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '👁️‍🗨️', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'] },
  flags: { icon: '🏳️', emojis: ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇨', '🇦🇩', '🇦🇪', '🇦🇫', '🇦🇬', '🇦🇮', '🇦🇱', '🇦🇲', '🇦🇴', '🇦🇶', '🇦🇷', '🇦🇸', '🇦🇹', '🇦🇺', '🇦🇼', '🇦🇽', '🇦🇿', '🇧🇦', '🇧🇧', '🇧🇩', '🇧🇪', '🇧🇫', '🇧🇬', '🇧🇭', '🇧🇮', '🇧🇯', '🇧🇱', '🇧🇲', '🇧🇳', '🇧🇴', '🇧🇶', '🇧🇷', '🇧🇸', '🇧🇹', '🇧🇻', '🇧🇼', '🇧🇾', '🇧🇿', '🇨🇦', '🇨🇨', '🇨🇩', '🇨🇫', '🇨🇬', '🇨🇭', '🇨🇮', '🇨🇰', '🇨🇱', '🇨🇲', '🇨🇳', '🇨🇴', '🇨🇵', '🇨🇷', '🇨🇺', '🇨🇻', '🇨🇼', '🇨🇽', '🇨🇾', '🇨🇿', '🇩🇪', '🇩🇬', '🇩🇯', '🇩🇰', '🇩🇲', '🇩🇴', '🇩🇿', '🇪🇦', '🇪🇨', '🇪🇪', '🇪🇬', '🇪🇭', '🇪🇷', '🇪🇸', '🇪🇹', '🇪🇺', '🇫🇮', '🇫🇯', '🇫🇰', '🇫🇲', '🇫🇴', '🇫🇷', '🇬🇦', '🇬🇧', '🇬🇩', '🇬🇪', '🇬🇫', '🇬🇬', '🇬🇭', '🇬🇮', '🇬🇱', '🇬🇲', '🇬🇳', '🇬🇵', '🇬🇶', '🇬🇷', '🇬🇸', '🇬🇹', '🇬🇺', '🇬🇼', '🇬🇾', '🇭🇰', '🇭🇲', '🇭🇳', '🇭🇷', '🇭🇹', '🇭🇺', '🇮🇨', '🇮🇩', '🇮🇪', '🇮🇱', '🇮🇲', '🇮🇳', '🇮🇴', '🇮🇶', '🇮🇷', '🇮🇸', '🇮🇹', '🇯🇪', '🇯🇲', '🇯🇴', '🇯🇵', '🇰🇪', '🇰🇬', '🇰🇭', '🇰🇮', '🇰🇲', '🇰🇳', '🇰🇵', '🇰🇷', '🇰🇼', '🇰🇾', '🇰🇿', '🇱🇦', '🇱🇧', '🇱🇨', '🇱🇮', '🇱🇰', '🇱🇷', '🇱🇸', '🇱🇹', '🇱🇺', '🇱🇻', '🇱🇾', '🇲🇦', '🇲🇨', '🇲🇩', '🇲🇪', '🇲🇫', '🇲🇬', '🇲🇭', '🇲🇰', '🇲🇱', '🇲🇲', '🇲🇳', '🇲🇴', '🇲🇵', '🇲🇶', '🇲🇷', '🇲🇸', '🇲🇹', '🇲🇺', '🇲🇻', '🇲🇼', '🇲🇽', '🇲🇾', '🇲🇿', '🇳🇦', '🇳🇨', '🇳🇪', '🇳🇫', '🇳🇬', '🇳🇮', '🇳🇱', '🇳🇴', '🇳🇵', '🇳🇷', '🇳🇺', '🇳🇿', '🇴🇲', '🇵🇦', '🇵🇪', '🇵🇫', '🇵🇬', '🇵🇭', '🇵🇰', '🇵🇱', '🇵🇲', '🇵🇳', '🇵🇷', '🇵🇸', '🇵🇹', '🇵🇼', '🇵🇾', '🇶🇦', '🇷🇪', '🇷🇴', '🇷🇸', '🇷🇺', '🇷🇼', '🇸🇦', '🇸🇧', '🇸🇨', '🇸🇩', '🇸🇪', '🇸🇬', '🇸🇭', '🇸🇮', '🇸🇯', '🇸🇰', '🇸🇱', '🇸🇲', '🇸🇳', '🇸🇴', '🇸🇷', '🇸🇸', '🇸🇹', '🇸🇻', '🇸🇽', '🇸🇾', '🇸🇿', '🇹🇦', '🇹🇨', '🇹🇩', '🇹🇫', '🇹🇬', '🇹🇭', '🇹🇯', '🇹🇰', '🇹🇱', '🇹🇲', '🇹🇳', '🇹🇴', '🇹🇷', '🇹🇹', '🇹🇻', '🇹🇼', '🇹🇿', '🇺🇦', '🇺🇬', '🇺🇲', '🇺🇳', '🇺🇸', '🇺🇾', '🇺🇿', '🇻🇦', '🇻🇨', '🇻🇪', '🇻🇬', '🇻🇮', '🇻🇳', '🇻🇺', '🇼🇫', '🇼🇸', '🇽🇰', '🇾🇪', '🇾🇹', '🇿🇦', '🇿🇲', '🇿🇼', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🏴󠁧󠁢󠁷󠁬󠁳󠁿'] }
};

const SAMPLE_STICKERS = [
  { id: 1, url: 'https://cdn.shopify.com/s/files/1/1061/1924/products/Thinking_Face_Emoji_large.png?v=1571606036', name: 'Thinking' },
  { id: 2, url: 'https://cdn.shopify.com/s/files/1/1061/1924/products/Heart_Eyes_Emoji_large.png?v=1571606036', name: 'Heart Eyes' },
  { id: 3, url: 'https://cdn.shopify.com/s/files/1/1061/1924/products/Smiling_Face_with_Heart-Eyes_Emoji_large.png?v=1571606036', name: 'Love' },
  { id: 4, url: 'https://cdn.shopify.com/s/files/1/1061/1924/products/Thumbs_Up_Sign_Emoji_large.png?v=1571606036', name: 'Thumbs Up' }
];

const SAMPLE_GIFS = [
  { id: 1, url: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif', title: 'Dance' },
  { id: 2, url: 'https://media.giphy.com/media/l1J9wXoC8W4JFmREY/giphy.gif', title: 'Celebration' },
  { id: 3, url: 'https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif', title: 'Happy' },
  { id: 4, url: 'https://media.giphy.com/media/3o7TKF1fSIs1R19B8k/giphy.gif', title: 'Love' }
];

const ModernChatInterface = ({ 
  selectedChat, 
  user, 
  socket, 
  isConnected, 
  onStartCall, 
  isCallActive, 
  callType, 
  onEndCall 
}) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "Hey! How are you doing? 😊",
      senderId: "other",
      timestamp: "10:30 AM",
      type: "text",
      reactions: [{ emoji: "❤️", count: 1 }, { emoji: "👍", count: 2 }]
    },
    {
      id: 2,
      content: "I'm doing great! Just finished working on a new project. Check this out:",
      senderId: user?.profileid,
      timestamp: "10:32 AM",
      type: "text",
      media: {
        type: "image",
        url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop"
      },
      status: "read"
    },
    {
      id: 3,
      content: "",
      senderId: "other",
      timestamp: "10:35 AM",
      type: "voice",
      voiceData: {
        duration: "0:15",
        waveform: [0.2, 0.4, 0.8, 0.6, 0.3, 0.7, 0.5, 0.9]
      }
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isThreadView, setIsThreadView] = useState(false);
  const [selectedMessageReaction, setSelectedMessageReaction] = useState(null);

  // Panel states
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [showGifPanel, setShowGifPanel] = useState(false);
  const [showAttachmentPanel, setShowAttachmentPanel] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
  // Emoji picker state
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('recent');
  
  // Media modal state
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState('normal');
  const [mediaCaption, setMediaCaption] = useState('');

  // GIF search
  const [gifSearchQuery, setGifSearchQuery] = useState('');

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const recordingTimer = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimer.current);
      setRecordingTime(0);
    }
    return () => clearInterval(recordingTimer.current);
  }, [isRecording]);

  const handleSendMessage = () => {
    if (!inputText.trim() && !selectedMedia) return;

    const newMessage = {
      id: Date.now(),
      content: inputText,
      senderId: user?.profileid,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: selectedMedia ? selectedMedia.type : 'text',
      media: selectedMedia || undefined,
      replyTo: replyingTo || undefined,
      status: 'sending'
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setSelectedMedia(null);
    setReplyingTo(null);
    setShowMediaModal(false);

    // Simulate message status updates
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
      ));
    }, 1000);

    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 2000);
  };

  const handleEmojiSelect = (emoji) => {
    setInputText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleStickerSend = (sticker) => {
    const newMessage = {
      id: Date.now(),
      content: '',
      senderId: user?.profileid,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'sticker',
      sticker: sticker,
      status: 'sending'
    };

    setMessages(prev => [...prev, newMessage]);
    setShowStickerPanel(false);
  };

  const handleGifSend = (gif) => {
    const newMessage = {
      id: Date.now(),
      content: '',
      senderId: user?.profileid,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'gif',
      gif: gif,
      status: 'sending'
    };

    setMessages(prev => [...prev, newMessage]);
    setShowGifPanel(false);
  };

  const handleFileSelect = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    setSelectedMedia({
      type: type === 'photo' ? 'image' : type === 'video' ? 'video' : 'file',
      url: fileUrl,
      name: file.name,
      size: file.size
    });

    if (type === 'photo' || type === 'video') {
      setShowMediaModal(true);
    } else {
      // Send file directly
      handleSendMessage();
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // Implement actual voice recording here
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Implement stop recording and create voice message
  };

  const handleReaction = (messageId, emoji) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          existingReaction.count += 1;
        } else {
          reactions.push({ emoji, count: 1 });
        }
        
        return { ...msg, reactions: [...reactions] };
      }
      return msg;
    }));
    setShowReactionPicker(false);
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMessage = (message) => {
    const isOwn = message.senderId === user?.profileid;
    const isOther = !isOwn;

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'} group`}
      >
        {/* Avatar */}
        {isOther && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            S
          </div>
        )}

        {/* Message Content */}
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
          {/* Reply Reference */}
          {message.replyTo && (
            <div className="mb-2 p-2 bg-gray-100 rounded-lg border-l-4 border-blue-500 text-sm">
              <p className="text-gray-600 font-medium">Replying to:</p>
              <p className="text-gray-800 truncate">{message.replyTo.content}</p>
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`relative p-3 rounded-2xl shadow-sm ${
              isOwn 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                : 'bg-white border border-gray-200 text-gray-900'
            }`}
          >
            {/* Message Content */}
            {message.type === 'text' && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )}

            {message.type === 'voice' && (
              <div className="flex items-center gap-3 min-w-[200px]">
                <button className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center hover:bg-opacity-30 transition-all">
                  <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-0.5"></div>
                </button>
                <div className="flex-1 flex items-center gap-1">
                  {message.voiceData?.waveform.map((height, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-white rounded-full transition-all duration-300"
                      style={{ height: `${height * 20}px` }}
                    ></div>
                  ))}
                </div>
                <span className="text-xs opacity-75">{message.voiceData?.duration}</span>
              </div>
            )}

            {message.type === 'image' && message.media && (
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={message.media.url} 
                  alt="Shared image" 
                  className="w-full max-w-sm object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {/* Open full screen */}}
                />
                {message.content && (
                  <p className="mt-2 text-sm">{message.content}</p>
                )}
              </div>
            )}

            {message.type === 'sticker' && message.sticker && (
              <div className="w-24 h-24">
                <img 
                  src={message.sticker.url} 
                  alt={message.sticker.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {message.type === 'gif' && message.gif && (
              <div className="rounded-lg overflow-hidden max-w-xs">
                <img 
                  src={message.gif.url} 
                  alt={message.gif.title}
                  className="w-full object-cover"
                />
              </div>
            )}

            {/* Message Time */}
            <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'} flex items-center gap-1`}>
              <span>{message.timestamp}</span>
              {isOwn && message.status && (
                <div className="flex">
                  {message.status === 'sending' && <div className="w-1 h-1 bg-blue-200 rounded-full"></div>}
                  {message.status === 'sent' && <div className="text-xs">✓</div>}
                  {message.status === 'delivered' && <div className="text-xs">✓✓</div>}
                  {message.status === 'read' && <div className="text-xs text-blue-200">✓✓</div>}
                </div>
              )}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 mt-1">
              {message.reactions.map((reaction, i) => (
                <div 
                  key={i}
                  className="bg-white border border-gray-200 rounded-full px-2 py-1 text-xs flex items-center gap-1 cursor-pointer hover:bg-gray-50"
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-gray-600">{reaction.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Actions */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => handleReply(message)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ReplyIcon className="w-4 h-4 text-gray-400" />
          </button>
          <button 
            onClick={() => setSelectedMessageReaction(message.id)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FaceSmileIcon className="w-4 h-4 text-gray-400" />
          </button>
          <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <EllipsisHorizontalIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </motion.div>
    );
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <MessageIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to SwagGo Chat</h3>
          <p className="text-gray-600">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {isThreadView && (
            <button 
              onClick={() => setIsThreadView(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          )}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-medium">
              {selectedChat?.participants?.[0]?.username?.[0] || 'U'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {selectedChat?.participants?.[0]?.username || 'Unknown User'}
            </h3>
            <p className="text-sm text-green-500">Online • Last seen 2m ago</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <SearchIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => onStartCall('voice')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <PhoneIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => onStartCall('video')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <VideoCameraIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <EllipsisHorizontalIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-3 bg-blue-50 border-t border-blue-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-blue-700">Replying to</p>
                <p className="text-sm text-blue-600 truncate max-w-xs">{replyingTo.content}</p>
              </div>
            </div>
            <button 
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:bg-blue-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-blue-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        {/* Tool Buttons */}
        <div className="flex items-center gap-2 mb-3">
          <button 
            onClick={() => setShowAttachmentPanel(!showAttachmentPanel)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <PaperClipIcon className="w-5 h-5 text-gray-500" />
          </button>
          <button 
            onClick={() => photoInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <CameraIcon className="w-5 h-5 text-gray-500" />
          </button>
          <button 
            onClick={() => setShowStickerPanel(!showStickerPanel)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-5 h-5 bg-yellow-400 rounded-lg flex items-center justify-center text-xs">S</div>
          </button>
          <button 
            onClick={() => setShowGifPanel(!showGifPanel)}
            className="px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium text-gray-600"
          >
            GIF
          </button>
        </div>

        {/* Message Input */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="w-full px-4 py-3 pr-20 bg-gray-100 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button 
                onClick={() => setShowEmojiPanel(!showEmojiPanel)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <FaceSmileIcon className="w-5 h-5 text-gray-500" />
              </button>
              {!inputText && (
                <button 
                  onMouseDown={handleStartRecording}
                  onMouseUp={handleStopRecording}
                  className={`p-1 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white' : 'hover:bg-gray-200 text-gray-500'}`}
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputText.trim() && !selectedMedia}
            className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Feature Panels */}
      
      {/* Emoji Panel */}
      <AnimatePresence>
        {showEmojiPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 right-4 w-80 h-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          >
            <div className="flex border-b border-gray-200 bg-gray-50 p-2">
              {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setSelectedEmojiCategory(key)}
                  className={`p-2 rounded-lg transition-colors ${
                    selectedEmojiCategory === key ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                </button>
              ))}
            </div>
            <div className="p-3 h-72 overflow-y-auto">
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_CATEGORIES[selectedEmojiCategory]?.emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="p-2 text-xl hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticker Panel */}
      <AnimatePresence>
        {showStickerPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 right-4 w-80 h-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Stickers</h3>
              <div className="flex gap-2 mt-2">
                <button className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm">Recent</button>
                <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">Favorites</button>
                <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">Custom</button>
              </div>
            </div>
            <div className="p-3 h-72 overflow-y-auto">
              <div className="grid grid-cols-4 gap-3">
                {SAMPLE_STICKERS.map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => handleStickerSend(sticker)}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:bg-gray-200 transition-colors"
                  >
                    <img 
                      src={sticker.url} 
                      alt={sticker.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GIF Panel */}
      <AnimatePresence>
        {showGifPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 right-4 w-80 h-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">GIFs</h3>
              <div className="relative">
                <input
                  type="text"
                  value={gifSearchQuery}
                  onChange={(e) => setGifSearchQuery(e.target.value)}
                  placeholder="Search GIFs..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2">
                  <SearchIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-3 h-72 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {SAMPLE_GIFS.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => handleGifSend(gif)}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <img 
                      src={gif.url} 
                      alt={gif.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment Panel */}
      <AnimatePresence>
        {showAttachmentPanel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-20 left-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50"
          >
            <div className="grid grid-cols-3 gap-4 w-48">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <DocumentIcon className="w-6 h-6 text-blue-500" />
                </div>
                <span className="text-xs text-gray-700">Document</span>
              </button>
              
              <button 
                onClick={() => photoInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <PhotoIcon className="w-6 h-6 text-green-500" />
                </div>
                <span className="text-xs text-gray-700">Photo</span>
              </button>
              
              <button 
                onClick={() => videoInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <VideoCameraIcon className="w-6 h-6 text-purple-500" />
                </div>
                <span className="text-xs text-gray-700">Video</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Recording Overlay */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl p-6 flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center"
              >
                <MicrophoneIcon className="w-8 h-8 text-white" />
              </motion.div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 mb-1">Recording...</p>
                <p className="text-red-500 text-lg font-mono">{formatTime(recordingTime)}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsRecording(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleStopRecording}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Modal */}
      <AnimatePresence>
        {showMediaModal && selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Send Media</h3>
                <button 
                  onClick={() => setShowMediaModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  {selectedMedia.type === 'image' && (
                    <img src={selectedMedia.url} alt="Preview" className="w-full rounded-lg" />
                  )}
                  {selectedMedia.type === 'video' && (
                    <video src={selectedMedia.url} controls className="w-full rounded-lg" />
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
                    <div className="space-y-2">
                      {['normal', 'hd', 'view-once'].map((type) => (
                        <label key={type} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="mediaType"
                            value={type}
                            checked={mediaType === type}
                            onChange={(e) => setMediaType(e.target.value)}
                            className="text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm capitalize">
                            {type === 'view-once' ? 'View Once' : `${type} Quality`}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      value={mediaCaption}
                      onChange={(e) => setMediaCaption(e.target.value)}
                      placeholder="Add a caption..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200 flex gap-3 justify-end">
                <button 
                  onClick={() => setShowMediaModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reaction Picker */}
      <AnimatePresence>
        {selectedMessageReaction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-xl border border-gray-200 p-2 z-50"
          >
            <div className="flex gap-2">
              {['❤️', '👍', '👎', '😂', '😮', '😢', '🎉'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(selectedMessageReaction, emoji)}
                  className="p-2 text-xl hover:bg-gray-100 rounded-full transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        onChange={(e) => handleFileSelect(e, 'document')}
        className="hidden"
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, 'photo')}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleFileSelect(e, 'video')}
        className="hidden"
      />
    </div>
  );
};

export default ModernChatInterface;
