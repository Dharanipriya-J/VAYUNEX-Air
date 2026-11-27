import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AiAssistant } from '../src/components/AiAssistant';
import { ImpactSimulator } from '../src/components/ImpactSimulator';
import { IndoorAirLab } from '../src/components/IndoorAirLab';
import { ProfileModal } from '../src/components/ProfileModal';
import { RoutinePlanner } from '../src/components/RoutinePlanner';
import { SettingsModal } from '../src/components/SettingsModal';
import { DEFAULT_PROFILE } from '../src/data/knowledgeBase';
import { generateRoutine } from '../src/services/vayuAiEngine';
import type { AirQualityData } from '../src/types/vayunex';

const SAMPLE_AQ: AirQualityData = {
  city: { id: 'delhi', name: 'New Delhi', country: 'India', lat: 28.6139, lon: 77.209 },
  aqi: 185,
  pm25: 88.5,
  pm10: 142.0,
  no2: 44.0,
  o3: 38.0,
  co: 920,
  so2: 14.0,
  source: 'estimated',
  updatedAt: '12:00',
  hourly: [
    { time: '2026-11-25T07:00', hourLabel: '07:00', aqi: 210, pm25: 98, pm10: 160 },
    { time: '2026-11-25T14:00', hourLabel: '14:00', aqi: 132, pm25: 58, pm10: 95 },
    { time: '2026-11-25T21:00', hourLabel: '21:00', aqi: 245, pm25: 118, pm10: 190 },
  ],
};

describe('Interactive UI Components', () => {
  it('AiAssistant sends prompts and renders live impact cards', async () => {
    const user = userEvent.setup();
    render(<AiAssistant aq={SAMPLE_AQ} profile={DEFAULT_PROFILE} />);

    expect(screen.getByRole('log')).toBeInTheDocument();
    const input = screen.getByLabelText('Ask VayuNex AI');
    await user.type(input, 'Plan today routine for my family');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/PM2\.5 Exposure Cut/i)).toBeInTheDocument();
    });
  });

  it('RoutinePlanner supports keyboard toggle and custom habit creation', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onAdd = vi.fn();
    const slots = generateRoutine(SAMPLE_AQ, DEFAULT_PROFILE);

    render(<RoutinePlanner slots={slots} onToggleSlot={onToggle} onAddCustomSlot={onAdd} />);

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes[0].focus();
    await user.keyboard('{Enter}');
    expect(onToggle).toHaveBeenCalledWith(slots[0].id);

    await user.click(screen.getByRole('button', { name: /add habit/i }));
    await user.type(screen.getByLabelText('Habit title'), 'Run bedroom purifier');
    await user.click(screen.getByRole('button', { name: /save to routine/i }));
    expect(onAdd).toHaveBeenCalledWith('Run bedroom purifier', '14:00 – 14:30', 'Custom low-emission household habit.');
  });

  it('IndoorAirLab updates CADR calculation when room area changes', () => {
    const onToggle = vi.fn();
    render(<IndoorAirLab savedHackIds={['cooking-capture']} onToggleHack={onToggle} outdoorPm25={88.5} />);

    expect(screen.getByText('188 CFM')).toBeInTheDocument();
    const areaSlider = screen.getByLabelText('Room Area');
    fireEvent.change(areaSlider, { target: { value: '600' } });
    expect(screen.getByText('450 CFM')).toBeInTheDocument();
  });

  it('ImpactSimulator toggles swaps cleanly', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<ImpactSimulator selectedSwapIds={['commute-transit']} onToggleSwap={onToggle} familySize={4} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);
    expect(onToggle).toHaveBeenCalled();
  });

  it('SettingsModal validates short API keys and closes on Escape', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <SettingsModal
        settings={{ alertThresholdAqi: 150, notificationsEnabled: true }}
        apiKey=""
        onSave={onSave}
        onClose={onClose}
      />
    );

    await user.type(screen.getByLabelText(/gemini api key/i), 'too-short');
    await user.click(screen.getByRole('button', { name: /save settings/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/minimum 20 characters/i);
    expect(onSave).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('ProfileModal saves sanitized household profile', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(<ProfileModal profile={DEFAULT_PROFILE} onSave={onSave} onClose={onClose} />);

    const nameInput = screen.getByLabelText('Household Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Green Home');
    await user.click(screen.getByRole('button', { name: /save & personalize/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ householdName: 'Green Home' }));
    expect(onClose).toHaveBeenCalled();
  });
});
