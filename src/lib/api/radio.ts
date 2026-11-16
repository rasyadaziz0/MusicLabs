import { RadioService } from './RadioService';
import { RadioStation, Song } from '@/types/music';

export { RadioService } from './RadioService';

const radioService = RadioService.getInstance();

export const searchRadioStations = (
  countryCode: string = 'ID',
  limit: number = 50,
  offset: number = 0
): Promise<RadioStation[]> => radioService.searchRadioStations(countryCode, limit, offset);

export const searchRadioByName = (
  query: string,
  limit: number = 30
): Promise<RadioStation[]> => radioService.searchRadioByName(query, limit);

export const searchRadioByTag = (
  tag: string,
  limit: number = 30
): Promise<RadioStation[]> => radioService.searchRadioByTag(tag, limit);

export const getTopStations = (
  limit: number = 50
): Promise<RadioStation[]> => radioService.getTopStations(limit);

export const radioStationToSong = (
  station: RadioStation
): Song => radioService.radioStationToSong(station);
