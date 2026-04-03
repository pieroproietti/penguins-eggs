""" Provides a thread safe Singleton object useful for sharing data between modules
    & creating logger / other objects you only want a single instance of.
"""
import threading
# python 3.7+ (fixes pylint 'too-few-public-methods'
from dataclasses import dataclass

# https://stackoverflow.com/questions/31875/is-there-a-simple-elegant-way-to-define-singletons
# https://stackoverflow.com/questions/6760685/creating-a-singleton-in-python

@dataclass
class SingletonThreadSafe:
    """ Resources shared by each and every instance.

        Based on tornado.ioloop.IOLoop.instance() approach.
        See https://github.com/facebook/tornado
    """
    __singleton_lock = threading.Lock()
    __singleton_instance = None

    @classmethod
    def instance(cls):
        """ Defines the classmethod - example configuration:

        from singleton import SingletonThreadSafe

        class MyClass(SingletonThreadSafe):
        ...

        MY_INSTANCE = MyClass.instance()
        """
        # check for the singleton instance
        if not cls.__singleton_instance:
            with cls.__singleton_lock:
                if not cls.__singleton_instance:
                    cls.__singleton_instance = cls()

        # return the singleton instance
        return cls.__singleton_instance
