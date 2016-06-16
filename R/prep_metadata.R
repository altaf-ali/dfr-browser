library(countrycode)
library(jsonlite)
library(lubridate)
library(stringr)
library(readr)
library(dplyr)
library(tidyr)

rm(list = ls())

ROOT_DIR <- "~/Projects/dfr-browser"

MODEL_DIR <- file.path(ROOT_DIR, "model")
DOC_TOPICS <- file.path(MODEL_DIR, "doc_topics.txt")
CITATIONS <- file.path(MODEL_DIR, "citations.tsv")
COUNTRIES <- file.path(MODEL_DIR, "countries.json")

doc_topics <- read_tsv(DOC_TOPICS, col_names = FALSE)

colnames(doc_topics) <- c("ID", "Filename", paste0("Topic_", seq(1, ncol(doc_topics)-2)))

doc_topics <- doc_topics %>%
  mutate(Filename = basename(str_replace(Filename, "file:", ""))) 

split_filename <- str_match(doc_topics$Filename, "([A-Z]{3,4})_(\\d{2})_(\\d{4})")

doc_topics <- doc_topics %>%
  mutate(Year = split_filename[,4],
         CountryCode = split_filename[,2], 
         CountryCode = ifelse(CountryCode == "YDYE", "YMD", CountryCode),
         Country = countrycode(CountryCode, "iso3c", "country.name", warn = TRUE)) %>%
  select(ID, Year, CountryCode, Country, Filename, starts_with("Topic_"))

# The DFR-Browser looks for the following metadata:
# id      doi     title   author  journaltitle    volume  issue   pubdate pagerange       publisher       type    reviewed-work   abstract
#

metadata <- doc_topics %>%
  mutate(ID = tools::file_path_sans_ext(Filename),
         DOI = paste0(Year, "/", Filename),
         Title = Country,
         Author = CountryCode,
         Journal = NA,
         Volume = NA,
         Issue = NA,
         Date = ISOdate(Year, 1, 1),
         Page = NA,
         Publisher = NA,
         Type = NA,
         Reviewed = NA,
         Abstract = NA)  %>%
  select(ID, DOI, Title, Author, Journal, Volume, Issue, Date, Page, Publisher, Type, Reviewed, Abstract)

countries <- doc_topics %>%
  group_by(CountryCode, Country) %>%
  summarise() %>%
  ungroup() %>%
  arrange(Country)

countries_sorted <- countries$CountryCode

countries <- countries %>%
  spread(CountryCode, Country)

countries <- countries[, countries_sorted]

write_tsv(metadata, CITATIONS)
write(toJSON(countries[1,], pretty = TRUE), file = COUNTRIES)

