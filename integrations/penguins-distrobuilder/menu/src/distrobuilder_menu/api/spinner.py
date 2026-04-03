""" Provides a console 'spinner' for longer running functionality.
"""
import sys
import threading
import itertools
import time
# app classes
from distrobuilder_menu.api.singleton import SingletonThreadSafe

class Spinner(SingletonThreadSafe):
    """ Adapted from: https://stackoverflow.com/a/58174909/555451
        usage:
                with Spinner("just waiting a bit.. "):
                    some_command_or_task
    """
    def __init__(self, message, delay=0.1):
        """ initialise the class
        """
        # fix pyint 'super-init-not-called'
        super().__init__()

        self.spinner = itertools.cycle(['-', '/', '|', '\\'])
        self.delay = delay
        self.busy = False
        self.spinner_visible = False

        # prevents pylint 'attribute-defined-outside-init'
        self._screen_lock = None
        self.thread = None

        sys.stdout.write(message)


    def write_next(self):
        """ called by spinner_task()
        """
        with self._screen_lock:
            if not self.spinner_visible:
                sys.stdout.write(next(self.spinner))
                self.spinner_visible = True
                sys.stdout.flush()


    def remove_spinner(self, cleanup=False):
        """ cleans up spinner
        """
        with self._screen_lock:
            if self.spinner_visible:
                sys.stdout.write('\b')
                self.spinner_visible = False
                if cleanup:
                    sys.stdout.write(' ')     # overwrite spinner with blank
                    sys.stdout.write('\r')    # move to next line
                sys.stdout.flush()


    def spinner_task(self):
        """ main functionality
        """
        while self.busy:
            self.write_next()
            time.sleep(self.delay)
            self.remove_spinner()


    def __enter__(self):
        """ Enter special method
        """
        if sys.stdout.isatty():
            self._screen_lock = threading.Lock()
            self.busy = True
            self.thread = threading.Thread(target=self.spinner_task)
            self.thread.start()


    def __exit__(self, exception, value, traceback):
        """ Exit special method
        """
        if sys.stdout.isatty():
            self.busy = False
            self.remove_spinner(cleanup=True)
        else:
            sys.stdout.write('\r')
