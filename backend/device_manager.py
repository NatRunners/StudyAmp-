import brainflow
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds, BrainFlowError
import logging

class DeviceManager:
    def __init__(self):
        logging.basicConfig(level=logging.INFO)
        self.connected = False
        self.board = None

        # Try Muse 2 first
        if not self._connect_muse():
            # If Muse fails, try synthetic board
            self._connect_synthetic()

    def _connect_muse(self):
        try:
            params = BrainFlowInputParams()
            params.serial_port = 'COM5'
            board_id = BoardIds.MUSE_2_BOARD.value

            self.board = BoardShim(board_id, params)
            self.board.prepare_session()

            # Enable necessary presets
            self.board.config_board("p50")  # Enable 5th EEG channel and PPG data

            self.board.start_stream()
            logging.info("Successfully connected to Muse 2 headset.")
            self.connected = True
            return True
        except BrainFlowError as e:
            logging.error(f"Failed to initialize Muse 2 headset: {e}")
            if self.board:
                self._cleanup_board()
            return False

    def _connect_synthetic(self):
        try:
            logging.info("Creating synthetic board session.")
            synthetic_params = BrainFlowInputParams()
            self.board = BoardShim(BoardIds.SYNTHETIC_BOARD.value, synthetic_params)
            self.board.prepare_session()
            self.board.start_stream()
            logging.info("Synthetic board session started.")
            self.connected = True
            return True
        except BrainFlowError as e:
            logging.error(f"Failed to create synthetic board: {e}")
            if self.board:
                self._cleanup_board()
            self.connected = False
            return False

    def _cleanup_board(self):
        try:
            if self.board.is_prepared():
                self.board.release_session()
            self.board = None
        except BrainFlowError as e:
            logging.error(f"Error cleaning up board: {e}")

    def get_data(self):
        if self.connected:
            try:
                data = self.board.get_current_board_data(100)
                return data
            except BrainFlowError as e:
                logging.error(f"Error fetching data: {e}")
                self.connected = False
                return []
        else:
            return []

    def stop(self):
        if self.connected:
            try:
                self.board.stop_stream()
                self.board.release_session()
                self.connected = False
                logging.info("Board session stopped.")
            except BrainFlowError as e:
                logging.error(f"Error stopping device: {e}")
