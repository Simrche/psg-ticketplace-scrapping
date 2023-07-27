
# PSG Ticketplace Scrapping

This project recovers the minimum prices available on the PSG ticket resale platform (Ticketplace) by match and category. 

### Setup

```
npm install

Add the categories to be scrapped to the targetedCategories variable (index.js line 5)

# Default 
const targetedCategories = ["15", "16"];

The more categories there are, the longer the function will take.
```

### Start the function

```
 npm run dev 
```

### Result format

```
{
    opponentTeam: {
        categoryNumber: minimumPrice
    }
}

# Exemple :
{
    "marseille": {
        "16": 70,
        "15": 80
    },
    "lyon": {
        "16": 40,
        "15": 50
    },
}
```