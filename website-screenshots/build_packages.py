# -*- coding: utf-8 -*-
import json

svcs = json.load(open('D:/client/beyomo_/website-screenshots/all_services.json', encoding='utf-8'))
by_name = {}
by_id = {}
for s in svcs:
    by_name.setdefault(s['name'], s)
    by_id[s['id']] = s


def sid(name):
    return by_name[name]['id']


# Excel row label -> DB service name(s) (list; combo cells expand to multiple services)
MAP = {
    "Basic Haircut": ["Classic Cut"],
    "Hot Oil Head Massage": ["Regular Oil Head Massage"],
    "Face De-tan": ["Face De-Tan (Fruit)"],
    "Cleanup": ["O3+ Cleanup"],
    "Face Massage": ["Face Massage"],
    "Full Arms Rica Waxing": ["Full Arms Wax (RICA)"],
    "Half Legs Rica Waxing": ["Half Legs Wax (RICA)"],
    "Under Arms Rica Waxing": ["Under Arms Wax (RICA)"],
    "Neck De-tan": ["Neck De-Tan (Fruit)"],
    "Neck Polish": ["Neck Polish"],
    "Blouse Line De-tan": ["Blouse Line De-Tan (Fruit)"],
    "De-tan Full Hands": ["Full Hands De-Tan (Fruit)"],
    "De-Tan Full Hands": ["Full Hands De-Tan (Fruit)"],
    "Manicure": ["Lavendor Manicure"],
    "Foot Massage": ["Foot Massage"],
    "Back Massage": ["Back Massage"],
    "Haircut": ["Haircut"],
    "Beard Trim": ["Beard Trim"],
    "Beard Color": ["Beard Color"],
    "Mustache Color": ["Mustache Colour"],
    "Gel Hair Color": ["Hair Colour (Loreal, Schwarzkopf)"],
    "Hair Spa": ["Hair Spa - Men (Loreal)"],
    "Hot Oil Massage": ["Deep Moisture Massage"],
    "Fruit De-tan F&N": ["Face & Neck De-Tan (Fruit)"],
    "Fruit Facial": ["Fruit Facial"],
    "Anti Tan Facial": ["AntiAgeing Facial"],
    "Chocolate Mint Facial": ["Chocolate Mint Facial"],
    "Gold Facial": ["Gold Facial"],
    "Peel Off Mask": ["Gold Peeloff"],
    "Full Arm Rica Waxing": ["Full Arms Wax (RICA)"],
    "Full Legs Rica Waxing": ["Full Legs Wax (RICA)"],
    "Fruit De-tan Full Arms": ["Full Hands De-Tan (Fruit)"],
    "Pedicure": ["Lavendor Pedicure"],
    "Creative Haircut": ["Creative Cut"],
    "Hair Color for Men": ["Hair Colour (Loreal, Schwarzkopf)"],
    "O3+ De-tan Face & Neck": ["Face & Neck De-Tan (O3+)"],
    "Diamond Facial": ["Gold Facial"],
    "Party Glow Facial": ["Party Glow Facial"],
    "Skin Tightening Facial": ["AntiAgeing Facial"],
    "Gold Peel Off Mask": ["Gold Peeloff"],
    "Vitamin-C Peel Off Mask": ["Vitamin-C Peeloff"],
    "Rica Waxing \u2013 Full Arms + Half Legs + Underarms": ["Full Arms Wax (RICA)", "Half Legs Wax (RICA)", "Under Arms Wax (RICA)"],
    "Wine Manicure": ["Wine Manicure"],
    "Wine Pedicure": ["Wine Pedicure"],
    "Hair Spa Matrix": ["Hair Spa - Men (Matrix)"],
    "Face & Neck De-tan": ["Face & Neck De-Tan (Fruit)"],
    "Pearl Facial": ["Pearl Facial"],
    "Wine Facial": ["Wine Facial"],
    "InstGlow Facial": ["Insta Glow Facial"],
    "Rica Waxing - FA + HL + UA": ["Full Arms Wax (RICA)", "Half Legs Wax (RICA)", "Under Arms Wax (RICA)"],
    "Half Arms De-tan": ["Half Hands De-Tan (Fruit)"],
    "Half Legs De-tan": ["Half Legs De-Tan (Fruit)"],
    "Chocolate Manicure": ["Chocolate Manicure"],
    "Chocolate Pedicure": ["Chocolate Pedicure"],
    "Aroma Body Massage": ["Aroma Relaxing Therapy"],
    "Stylish Haircut": ["Creative Cut"],
    "Root Touchup": ["Root Touchup (Women)"],
    "Hair Spa L'Or\u00e9al": ["Hair Spa - Men (Loreal)"],
    "O3+ DeTan Face & Neck": ["Face & Neck De-Tan (O3+)"],
    "Skin Lightening Facial": ["Skin Lightening Facial"],
    "Skin Whitening Facial": ["Skin Whitening Facial"],
    "Strawberry Facial": ["Strawberry Facial"],
    "O3+ Peel Off Mask": ["O3+ Radiant Peeloff"],
    "Back & Neck Polish": ["Back Polish", "Neck Polish"],
    "Rose Manicure": ["Rose Manicure"],
    "Rose Pedicure": ["Rose Pedicure"],
    "Deep Moisture Massage": ["Deep Moisture Massage"],
    "Hair Color \u2013 Global": ["Hair Colour (Loreal, Schwarzkopf)"],
    "Wella Hair Spa": ["Hair Spa - Men (Wella)"],
    "Korean Glass Facial": ["Korean Glass Facial"],
    "O3+ Radiant Facial": ["O3+ Bridal Facial"],
    "Ice Cream Pedicure & Manicure": ["Ice Cream Pedicure", "Ice Cream Manicure"],
    "Bubblegum Pedicure & Manicure": ["Bubblegum Pedicure", "Bubblegum Manicure"],
    "Full Body Rica Waxing": ["Full Body Wax (RICA)"],
    "O3+ De-tan (Face, Full Hands & Half Legs)": ["Face De-Tan (O3+)", "Full Hands De-Tan (O3+)", "Half Legs De-Tan (O3+)"],
    "Fruit DeTan Full Body": ["Full Body De-Tan (Fruit)"],
    "Body Polish": ["Body Polish"],
    "Deep Tissue Massage": ["Deep Tissue"],
    "Bikini Wax": ["Bikini Wax (RICA)"],
}

TIERS = [
    {"title": "Any 4 @ \u20b9999", "price": 999, "originalPrice": 1699, "count": 4, "rows": [
        "Basic Haircut", "Hot Oil Head Massage", "Face De-tan", "Cleanup", "Face Massage",
        "Full Arms Rica Waxing", "Half Legs Rica Waxing", "Under Arms Rica Waxing", "Neck De-tan",
        "Neck Polish", "Blouse Line De-tan", "De-tan Full Hands", "Manicure", "Foot Massage", "Back Massage"]},
    {"title": "Any 4 @ \u20b9999 (Men)", "price": 999, "originalPrice": 1699, "count": 4, "rows": [
        "Haircut", "Beard Trim", "Beard Color", "Mustache Color", "Gel Hair Color", "Hot Oil Head Massage",
        "Hair Spa", "Face De-tan", "Cleanup", "Face Massage", "Neck De-tan", "Neck Polish",
        "De-Tan Full Hands", "Foot Massage", "Back Massage"]},
    {"title": "Any 4 @ \u20b91999", "price": 1999, "originalPrice": 3199, "count": 4, "rows": [
        "Basic Haircut", "Hot Oil Massage", "Fruit De-tan F&N", "Fruit Facial", "Anti Tan Facial",
        "Chocolate Mint Facial", "Gold Facial", "Peel Off Mask", "Full Arm Rica Waxing", "Full Legs Rica Waxing",
        "Under Arms Rica Waxing", "Fruit De-tan Full Arms", "Manicure", "Pedicure", "Foot Massage"]},
    {"title": "Any 5 @ \u20b92999", "price": 2999, "originalPrice": 4499, "count": 5, "rows": [
        "Creative Haircut", "Hair Color for Men", "Hot Oil Massage", "O3+ De-tan Face & Neck", "Diamond Facial",
        "Party Glow Facial", "Skin Tightening Facial", "Gold Peel Off Mask", "Vitamin-C Peel Off Mask",
        "Rica Waxing \u2013 Full Arms + Half Legs + Underarms", "Wine Manicure", "Wine Pedicure", "Foot Massage", "Back Massage"]},
    {"title": "Any 5 @ \u20b93499", "price": 3499, "originalPrice": 5199, "count": 5, "rows": [
        "Creative Haircut", "Hair Spa Matrix", "Face & Neck De-tan", "Anti Tan Facial", "Pearl Facial", "Wine Facial",
        "InstGlow Facial", "Gold Peel Off Mask", "Rica Waxing - FA + HL + UA", "Half Arms De-tan", "Half Legs De-tan",
        "Chocolate Manicure", "Chocolate Pedicure", "Wine Pedicure", "Aroma Body Massage"]},
    {"title": "Any 7 @ \u20b94999", "price": 4999, "originalPrice": 7499, "count": 7, "rows": [
        "Stylish Haircut", "Root Touchup", "Hair Spa L'Or\u00e9al", "O3+ DeTan Face & Neck", "Skin Lightening Facial",
        "Pearl Facial", "Skin Whitening Facial", "Strawberry Facial", "O3+ Peel Off Mask",
        "Rica Waxing \u2013 Full Arms + Half Legs + Underarms", "Back & Neck Polish", "Rose Manicure", "Rose Pedicure",
        "Aroma Body Massage", "Deep Moisture Massage"]},
    {"title": "Any 5 @ \u20b99999", "price": 9999, "originalPrice": 14999, "count": 5, "rows": [
        "Stylish Haircut", "Hair Color \u2013 Global", "Wella Hair Spa", "Skin Lightening Facial", "Korean Glass Facial",
        "O3+ Radiant Facial", "Ice Cream Pedicure & Manicure", "Bubblegum Pedicure & Manicure", "Full Body Rica Waxing",
        "O3+ De-tan (Face, Full Hands & Half Legs)", "Fruit DeTan Full Body", "Body Polish", "Deep Tissue Massage",
        "Bikini Wax", "O3+ Peel Off Mask"]},
]

all_missing = set()
resolved_tiers = []
for tier in TIERS:
    ids = []
    seen = set()
    unresolved = []
    for row in tier['rows']:
        dbnames = MAP.get(row)
        if dbnames is None:
            unresolved.append(row)
            continue
        for dn in dbnames:
            if dn not in by_name:
                unresolved.append(dn + " (NOT FOUND)")
                continue
            i = sid(dn)
            if i not in seen:
                seen.add(i)
                ids.append(i)
    print("=== %s (price %s, pick %s) ===" % (tier['title'], tier['price'], tier['count']))
    print("  resolved (%d):" % len(ids))
    for i in ids:
        print("    [%d] %s" % (i, by_id[i]['name']))
    if unresolved:
        print("  UNRESOLVED:", unresolved)
        all_missing.update(unresolved)
    print()
    resolved_tiers.append({**tier, "serviceIds": ids})

if all_missing:
    print("TOTAL UNRESOLVED:", sorted(all_missing))
else:
    print("ALL ROWS RESOLVED OK")

with open('D:/client/beyomo_/website-screenshots/resolved_tiers.json', 'w', encoding='utf-8') as f:
    json.dump(resolved_tiers, f, ensure_ascii=False, indent=2)
