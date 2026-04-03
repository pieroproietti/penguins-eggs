""" A simple class to generate console menus
"""
from distrobuilder_menu import utils

class Menu:
    """A class that accepts lists & dictionaries as data sources to display
       a console menu & validate integer user input.

       * For list data the real index of the choice is returned.
       * For dict data a dict is returned with the choice in 2 keys 'key' / 'value'
    """
    def __init__(self, title, question, data, display=None):
        """ Initialises the Menu class with positional args:

            * title, question, data, [ display ]
            * data can be a list[] or dict{}

            the optional arg for 'display' can be 'keys' / 'values' or 'both'
            to specifiy their values to show from the data dictionary.
        """
        self.title = title
        self.question = question
        self.data = data
        self.display = display

        # this menu processes integer choices only
        self.question_regex = '[0-9]+'
        self.choice = None

        # sometimes the choice line is a single item
        if len(self.data) > 1:
            self.choice_line = f"{self.question} [ 1 - {len(self.data)} ] : "
        else:
            self.choice_line = f"{self.question} [ 1 ] : "


    def get_choice(self):
        """ Displays the console menu via instance methods:

        * menu_from_list (overrides)
        * menu_from_dict (templates)

        & reuses get_input() from the utils class
        """
        data_type = type(self.data)
        print(f"\n{self.title}\n")

        # print menu lines
        if data_type is list:
            self.menu_from_list(self.data)

        # print menu lines (optionally keys / values or both)
        if data_type is dict:
            self.menu_from_dict(self.data, self.display)

        # formatting
        print('')

        # validate integer input (quit on empty input)
        while True:
            try:
                self.choice = utils.get_input(self.choice_line, self.question_regex,
                                              accept_empty=True, convert=int
                                              )
                if self.choice < 1 or self.choice > len(self.data):
                    # restart the loop
                    continue
                break
            except ValueError:
                if data_type is dict:
                    # functions passing data here as a dict expect a dict response
                    return {'key': 'user_quit', 'value': 'user_quit'}
                # functions passing a list don't access an index immediately
                return 'user_quit'

        # convert dict to list to find the key by index
        if data_type is dict:
            index_dict = list(self.data)
            key = index_dict[self.choice -1]
            value = self.data[key]

            return {'key': key, 'value': value}

        # return real list index
        if data_type is list:
            return self.choice -1

        # pylint inconsistent-return-statements (PEP8)
        return 'unhandled data_type in menus.get_choice()'


    def menu_from_dict(self, line_dict, display_types):
        """ Instance method to print numbered menu lines from a dictionary
            with the option to show keys / values or both.

            Used by all menu functions except menu_versions().
        """
        line_num = 1
        max_spacer = len(str(len(line_dict)))

        # match / case requires python 3.10+
        # Debian Stable (Bookworm) is on 3.11 so use new features
        match display_types:
            case 'both':
                for key, value in line_dict.items():
                    space_length = max_spacer - len(str(line_num))
                    print(f"{space_length*' '} {line_num} : {key} {value}")
                    line_num += 1
            case 'keys':
                for key in line_dict:
                    space_length = max_spacer - len(str(line_num))
                    print(f"{space_length*' '} {line_num} : {key}")
                    line_num += 1
            case 'values':
                for key in line_dict:
                    space_length = max_spacer - len(str(line_num))
                    print(f"{space_length*' '} {line_num} : {line_dict[key]}")
                    line_num += 1
            case _:
                utils.die(1, 'Param Error: Menu class "display" != keys || values || both')


    def menu_from_list(self, lines):
        """Simple instance method to loop through a list
           & print menu lines with numbers.

           Used by menu_versions() whose data is a list.
        """
        line_num = 1
        max_spacer = len(str(len(lines)))

        for item in lines:
            space_length = max_spacer - len(str(line_num))
            print(f"{space_length*' '} {line_num} : {item}")
            line_num += 1
