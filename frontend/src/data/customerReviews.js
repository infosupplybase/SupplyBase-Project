/**
 * Reviews shown in the home page "Client Stories" section, copied word for
 * word from our Google Business page. Reviews with photos are shown first.
 *
 * Only real reviews from real customers belong here — not reviews written by
 * our own team or from the business's own account. While this list is empty
 * the section shows an invitation to book instead. Shape:
 *   { id: 'g1', name: 'Name as shown on Google', rating: 5,
 *     review: 'What they said', source: 'google',
 *     photos: ['https://lh3.googleusercontent.com/...'] }
 * `photos` is optional: the photos the customer attached to their Google
 * review, linked from Google (the site's CSP already allows
 * *.googleusercontent.com). Local copies under public/assets/reviews/ work too.
 */
const customerReviews = [
  {
    id: 'g1',
    name: 'Rashid Khan',
    rating: 5,
    review:
      'I had a great experience with SUPPLYBASE! Their team provides professional home interior and painting services with a focus on quality, finishing, and customer satisfaction. The team was helpful, responsive, and attentive to details. Highly recommended for anyone looking for reliable home improvement services.',
    source: 'google',
    photos: [
      'https://lh3.googleusercontent.com/grass-cs/AABkmLetZnE-0UXM9ip3xH_F7ZvzQOYSUhOiJ15TzXyqQeuiEyrHB2ITkhCEyNGxhRCGr2nGAUpwoX3NGgkJZI3SVzktWMEaxikiDfRUsRdaIM8yZ9k0vcZRLgIzTnkv9I1GrH7LgZb6MQF6ruY=w800',
      'https://lh3.googleusercontent.com/grass-cs/AABkmLeBKo0kKVidV0QzNT6vEEUuHjlCi6ox8aXmkQQThdWeiG7-E7aNGmn9XuIJjTuxY9n71LPnoU1VzILJvvNf4mgtLgcz-MzOJOM24Lq9_vhOViZokQS-GuT_u1fUgyxFYgwGiO9SjquwFUA=w800',
      'https://lh3.googleusercontent.com/grass-cs/AABkmLdXwdxMe93xMQspB0lET8-wz_THCEtYXiTOOm6M6kbnh_CEpzx-g82D60iSyfruqN2u5tuSb_vAAY_dCxOin-mmxlRCYn1Hz3O68IqimeRiSZsFGAsSNpmeepbBANAzH_Mf9k-HGfVHqMg=w800',
    ],
  },
  {
    id: 'g2',
    name: 'Fatima Basheer',
    rating: 5,
    review:
      'Transformed our living room completely!\nSupplybase did an amazing job on our hall. The cove lighting, wall paneling, and TV unit design gave the space a very warm, high-end feel. Visitors keep asking who did our interiors! Huge thanks to the whole Supplybase team for making it a stress-free process.',
    source: 'google',
    photos: [
      'https://lh3.googleusercontent.com/grass-cs/AABkmLf1XgAj1NTjQFKV5pguCQM7PZiUNFlN078we3AXCAhRcc_j5yH8UT8T-TRlFlgIPFzKP8DE5wuHyGH2zuPGHhjqAyYxp-j7REobjXIGElZgD3gJyf1WSGkhl1qlpadLQi978jv0S0pn7_Cq=w800',
      'https://lh3.googleusercontent.com/grass-cs/AABkmLeYt6rCd1jqvEBEjRQOiuBMneWPbWLyENQQEEbBiZ9ITkTtzwFrGjI66w9mUUngJBC6QQeHFFhqQBCBGkrzcwYB62gdJQ5zLTgglhYnSpgKU_n9rJl4fISQq_lVI1ytbHgxYdZqzaH44eY_=w800',
    ],
  },
  {
    id: 'g3',
    name: 'Toufik Shaikh',
    rating: 5,
    review:
      'Excellent quality and sleek finishing\nSupplybase designed our modular kitchen and wardrobes. The storage planning was super practical, and the finish on the acrylic cabinets looks really premium. What I appreciated most was how transparent they were with costs and timelines throughout the project.',
    source: 'google',
    photos: [
      'https://lh3.googleusercontent.com/grass-cs/AABkmLeBsOiChkuZNZZV9CpOHcFbslPQFEiPAhOFjSxmQN6l5crWWMibKNOYcgU-PtEKTGfMSPjHpGBY5CZ4GGZ4fVg4MA-zaP4oh8Y3EVkeX-CnSaSuLvjBhm2xSINlo7rRYUs-HAcfI7RAAGnu=w800',
      'https://lh3.googleusercontent.com/grass-cs/AABkmLcvGdXOIaeNlc2KLt0QpX_dxnQCyN8xV-NTA_Jx0dPOhMFX8LQCpDOkltDRXyof5n8Nzu3q9MQdQkc9geDt-DOi2iivEa-SgICPUIWsdSp8LQLaYzhghYfC4bfn5pJQuo3nFYmkdHLeEWlN=w800',
      'https://lh3.googleusercontent.com/grass-cs/AABkmLdzuFly-BFh_ausbhJPko8qtyosqEbtouafYTjPh05m3kxMFO8H9VYMmP-LNkg60QeSBgZh4_RUS1Wp0rVtVSrVgkMDu2xo6fDElZyhSNVzTxdsYok_fK6thL6-TjSob1F8RScMJFmXFQxC=w800',
    ],
  },
  {
    id: 'g4',
    name: 'BuildBack',
    rating: 5,
    review:
      'They designed our bedroom, and it turned out so calm and beautiful! The soft green pastel tones, wooden rattan bed, and wall moulding with the lit-up painting look straight out of a Pinterest board. The sliding wardrobe finish is super smooth too. Really clean work and great execution. Thanks guys',
    source: 'google',
    photos: [
      'https://lh3.googleusercontent.com/grass-cs/AABkmLfJ50GSBVSgFyG-RbxTGdfj49vf8-qZQQTTDvKCSTPE078sCChGHBSiQX4zbLTjSjf4CmlaSdMoh0bDpGQR1qNvG15CORgoZFckjhfbu4asOWX1roCwoXbggWFBqV-Cxn2WVnBBfLMlCYLN=w800',
      'https://lh3.googleusercontent.com/grass-cs/AABkmLcwNDKNkE-9HscHsNbm9tdZjvOCbXmJVWU3Z9qXOKTdJE-KAnwQdvaPva0mU31qOt0JjBHP-fqP6NlPXT46-49srpHGSwJoUJGoKDYOQrEp967CmwErpH007vdCzeWKIQreQmXlKHpnE1uj=w800',
      'https://lh3.googleusercontent.com/grass-cs/AABkmLc5S89RLlKmUPYPGNkgBiadHbo16WZm8SS6v3cRJwoP9Xv9b4HCfTOo_p6TB8t83tnRBMMMxJJ0EKVV_pzmhqPVU_MXV2hB5BvJQ3Ts_xCSB1hLxjW_atfKryWldv8L4G0T7YTh_Tt3DMo=w800',
    ],
  },
  {
    id: 'g5',
    name: 'Lost man In universe',
    rating: 5,
    review:
      'Loved working with Supplybase for our home interiors! The execution, especially the lighting, custom woodwork, and kitchen setup, is very neat. Very professional team and great design sense. Would 100% recommend!',
    source: 'google',
    photos: [
      'https://lh3.googleusercontent.com/grass-cs/AABkmLcbOu1WK9MsUZRvSRkuyyorEmY_dzE4lQ2ChWfQ9L70wwd_IPazoVWvMxTjb9I3w7KF0fR7WICLeDr0YqUB-eJF8IMDLucXjV-isG9qltnJ06iIrAc9xICmgsLteWDiBf6C9RAgySCTiAjm=w800',
      'https://lh3.googleusercontent.com/grass-cs/AABkmLdE3tqbd_fYwlvXmOLg5iDHTwRSpd0uWJrEzEMw0Lcyc1WIz1NE7sLiTEo-j8Um5ULMw0-pgdEowdgmQQfMfu0j7jKgmvNlBzAZpNckHarrZQEdqF13rA88HAgf8pM4F6_i-eUiR3b3OhOB=w800',
      'https://lh3.googleusercontent.com/grass-cs/AABkmLfKpQeshydVieGBo_yrbeJeKYfBhOfWEv8iHkMqBZylU8VJOZldxWvx1ntdtzwCxsCyRa6isrzTWMcurqbW1N7Rn1Ak3Yb099xwusMuGAY5IT0Lslddn-fcPv0bVeeMafZcFrsNLATMdcah=w800',
    ],
  },
  {
    id: 'g6',
    name: 'My Life Decor',
    rating: 5,
    review:
      'Working with Supplybase was a fantastic experience from start to finish! They turned our living space into a warm, modern, and high-end home.\nFeature Wall & Accent Lighting: The arched wall mouldings with subtle floral artwork and warm designer sconces add so much charm and elegance.\nTV Unit & Display Nooks: The marble-texture back panel, fluted wood paneling, rounded floating TV console, and arch display niches create a striking focal point.\nSmart Storage Solutions: The custom entry cabinets with stepped storage and sleek vertical line detailing are both super functional and stylish.\nCeiling & Ambiance: The false ceiling lights, chandelier, and warm beige-brown color palette give the room a bright yet cozy feeling.\nFlawless craftsmanship and remarkable design sense. Huge thanks to the Supplybase team!',
    source: 'google',
    photos: [
      'https://lh3.googleusercontent.com/grass-cs/AABkmLdCNojemcWITT2ZKm-5nWFw5Wyf5NyuwzqGYbgdfmgr-5L8Jff_U0nKcjyzrFPyFIYrcIjhX-C5U04G6p0rWU4ZhOPcK0t-KM4Yzit6iYyeYKEffnWzBjo6196Cva5yCSOEZJnKaQQg6qCN=w800',
      'https://lh3.googleusercontent.com/grass-cs/AABkmLdFI7XxE9aC6LQZ71Ca7lrhLsZuFUQWfwgWVLMMGwcIJUhAefKNpJlYyXllXz24FqDQzwxRAh0WE-NxG8QV-Pc0YGbU-2KvlKwGdwdZ-LZs6AKgPvV3oPfhDiSlqLG7CG7QuDcDXRZg8Spi=w800',
      'https://lh3.googleusercontent.com/grass-cs/AABkmLf-PWUUWXX8otL7dXg-HDMGB9qolobPjnS9nqeBybSiC9Jz_gGOU0GWYMFwDuCW57Jtes7n96gDnajQQdcEqy9f1PEhg5HiR2FqpHkgDxdsqkYPwpyQVrzEvN1A7eGBc7Gsmd63fQBM-MP0=w800',
    ],
  },
  {
    id: 'g7',
    name: 'Atmaram Rane',
    rating: 5,
    review:
      'The team did an incredible job designing our living room, turning it into a calm, sophisticated, and modern space. The neutral beige and grey palette paired with warm natural wood tones creates such a welcoming and airy atmosphere. Everything came together seamlessly—from the soft curved cove lighting on the ceiling and the textured geometric wall art down to the fluted wooden partition and minimalist nested coffee tables. Every corner feels spacious, practical, and balanced. Their team was punctual, highly skilled, and finished the project with premium craftsmanship and zero hassle. Truly grateful for the wonderful transformation and highly recommend their work to anyone looking for refined home interiors!',
    source: 'google',
    photos: [
      'https://lh3.googleusercontent.com/grass-cs/AABkmLfuZrhhXJv12eFuez9qxmmVDXQwmAfNvXFXdOSxBFxJKwZ-PPtbTMBhR8Illg9kbjU8N4-h4G5xzj5mSTUIM3YQS-H09ieAeFVNkChY5HmNqrBqCBfYsY8uTb63u8qRZUY9XsHs0pLuSVgo=w800',
      'https://lh3.googleusercontent.com/grass-cs/AABkmLdvkTFSJerT2xtRGRzuau1nehgj5DVoeVX9uLSbOxvtXhtgcIHSABJU0iCFx4Ym-lvE6l6wbPO9mPx1gN7AOiZaCXsDuWPUWaO8URhLJDsnFtptIWXIKWspJvTCksQnOfhllBNABWw7DivM=w800',
      'https://lh3.googleusercontent.com/grass-cs/AABkmLeFm-KCFVbm-yThu9e1K3Deteijd-AjzTO8tTgjOcd2HOfmFYEYHZTmJo0kEySAfjO40AkTk0C2LOCP6dx9WfcLjnZpcN0U9GAEIULqy57sU9POSifChzOQJ5XWNdeBHgeZzVuFlReh6zd8=w800',
    ],
  },
  {
    id: 'g12',
    name: 'Khan Umme sumaiya',
    rating: 5,
    review:
      'Excellent coordination and daily updates\nCommunication was super clear throughout the project. Our site supervisor kept us updated with regular photo and video progress reports, so we always knew what was happening. Every small detail we discussed was executed exactly as planned. Very happy',
    source: 'google',
    photos: [
      'https://lh3.googleusercontent.com/grass-cs/AABkmLch8-BbntGDPV2SuDi1W3eN6t1Xd1SvtTa8Zx0lucbxZeDanJfqxeE-e9rZWgzSJZi7e3pRwkJBx0_zRLazKVWMJz-tepXZWCJ55qPpbCcph625h4IPVTXrXsdwsCsSnzS3_eIxWPs8LN_i=w800',
      'https://lh3.googleusercontent.com/grass-cs/AABkmLfBWBrukwtH287yrLJ9xqMpfAltFLvz5amLd2XJpwoT3OU0pwOABtuo0_TV0YsUoyEEkGTQlr-lB9FvP30vDgxkEZqY9i4vPHKLO-qnorB-5-e9csReS9RCcaXFvwFQjSVk5Z-UO1KAzCge=w800',
    ],
  },
  {
    id: 'g8',
    name: 'Naseem Khan',
    rating: 5,
    review:
      'The ceiling and ambient lighting work is top class!\nThe lighting design by Supplybase totally elevated the look of our flat. The soft cove lights, profile strips, and false ceiling designs create such a warm, luxurious feel in the evenings. Really neat wiring and clean finish overall',
    source: 'google',
  },
  {
    id: 'g9',
    name: 'Amruta Patil',
    rating: 5,
    review:
      'Top-notch work at a fair price\nWe got quotes from multiple interior design companies before choosing Supplybase. Their design suggestions were much more practical and fit well within our budget. The attention to detail in small things like edge banding, paint finishing, and switch placement was impressive. Definitely 5 stars!',
    source: 'google',
  },
  {
    id: 'g10',
    name: 'TYBT Prachi Singh',
    rating: 5,
    review: 'Best experience',
    source: 'google',
  },
  {
    id: 'g11',
    name: 'Shafi Sid',
    rating: 5,
    review: 'Nice 👍🙂',
    source: 'google',
  },
];

export default customerReviews;
